import os
import json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
import joblib


def main():
    print("Starting data cleaning and model training...")

    # Paths
    dataset_path = os.path.join("..", "dataset", "Bangalore  house data.csv")
    artifacts_dir = "artifacts"
    os.makedirs(artifacts_dir, exist_ok=True)
    model_path = os.path.join(artifacts_dir, "model.joblib")
    metadata_path = os.path.join(artifacts_dir, "model_metadata.json")

    # 1. Load data
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset not found at: {dataset_path}")
    df = pd.read_csv(dataset_path)
    print(f"Initial dataset shape: {df.shape}")

    # 2. Cleaning
    df2 = df.drop(['area_type', 'society', 'balcony', 'availability'], axis='columns')
    df3 = df2.dropna()
    print(f"Shape after dropping nulls: {df3.shape}")

    df3['bhk'] = df3['size'].apply(lambda x: int(x.split(' ')[0]))   # "2 BHK" -> 2
    df3 = df3.drop(['size'], axis='columns')

    def convert_sqft_to_num(x):
        tokens = x.split('-')
        if len(tokens) == 2:                     # "1000 - 1500" -> 1250
            try:
                return (float(tokens[0]) + float(tokens[1])) / 2
            except ValueError:
                return None
        try:
            return float(x)
        except ValueError:
            return None

    df4 = df3.copy()
    df4['total_sqft'] = df4['total_sqft'].apply(convert_sqft_to_num)
    df4 = df4.dropna(subset=['total_sqft'])
    print(f"Shape after cleaning total_sqft: {df4.shape}")

    # 3. Outlier removal
    df5 = df4[~(df4.total_sqft / df4.bhk < 300)]          # < 300 sqft per bedroom = suspicious
    print(f"Shape after area per bhk filter: {df5.shape}")

    df5['price_per_sqft'] = (df5['price'] * 100000) / df5['total_sqft']   # price is in lakhs

    def remove_pps_outliers(df_in):
        df_out = pd.DataFrame()
        for key, subdf in df_in.groupby('location'):
            m = np.mean(subdf.price_per_sqft)
            st = np.std(subdf.price_per_sqft)
            reduced_df = subdf[(subdf.price_per_sqft > (m - st)) & (subdf.price_per_sqft <= (m + st))]
            df_out = pd.concat([df_out, reduced_df], ignore_index=True)
        return df_out

    df6 = remove_pps_outliers(df5)
    print(f"Shape after price per sqft outliers filter: {df6.shape}")

    def remove_bhk_outliers(df_in):
        exclude_indices = np.array([])
        for location, location_df in df_in.groupby('location'):
            bhk_stats = {}
            for bhk, bhk_df in location_df.groupby('bhk'):
                bhk_stats[bhk] = {'mean': np.mean(bhk_df.price_per_sqft),
                                  'std': np.std(bhk_df.price_per_sqft),
                                  'count': bhk_df.shape[0]}
            for bhk, bhk_df in location_df.groupby('bhk'):
                stats = bhk_stats.get(bhk - 1)
                if stats and stats['count'] > 5:
                    exclude_indices = np.append(
                        exclude_indices, bhk_df[bhk_df.price_per_sqft < stats['mean']].index.values)
        return df_in.drop(exclude_indices, axis='index')

    df7 = remove_bhk_outliers(df6)
    print(f"Shape after bhk outliers filter: {df7.shape}")

    df8 = df7[df7.bath < df7.bhk + 2]
    print(f"Shape after bathroom filter: {df8.shape}")

    # 4. Location encoding
    df8.location = df8.location.apply(lambda x: x.strip())
    location_stats = df8.groupby('location')['location'].agg('count').sort_values(ascending=False)
    rare = location_stats[location_stats < 30]
    df8.location = df8.location.apply(lambda x: 'other' if x in rare else x)

    unique_locations = sorted(df8.location.unique())
    if 'other' in unique_locations:
        unique_locations.remove('other')
        unique_locations.append('other')
    print(f"Number of unique locations after grouping: {len(unique_locations)}")

    dummies = pd.get_dummies(df8.location, dtype=int)
    if 'other' in dummies.columns:
        dummies = dummies.drop(['other'], axis='columns')   # 'other' = all zeros
    df9 = pd.concat([df8, dummies], axis='columns')
    df10 = df9.drop(['location', 'price_per_sqft'], axis='columns')

    # 5. Modelling
    X = df10.drop(['price'], axis='columns')
    y = df10['price']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=10)
    print(f"Train set size: {X_train.shape[0]}, Test set size: {X_test.shape[0]}")

    lr_clf = LinearRegression()
    lr_clf.fit(X_train, y_train)

    score = lr_clf.score(X_test, y_test)
    y_pred = lr_clf.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    print(f"Model R^2 score: {score:.4f}")
    print(f"Model MSE: {mse:.4f}")

    # 6. Save artifacts
    joblib.dump(lr_clf, model_path)
    print(f"Model saved to {model_path}")

    coefficients_dict = {col: float(coef) for col, coef in zip(X.columns, lr_clf.coef_)}
    metadata = {
        "features": list(X.columns),
        "locations": [loc for loc in unique_locations if loc != 'other'],
        "metrics": {"r2_score": float(score), "mse": float(mse)},
        "intercept": float(lr_clf.intercept_),
        "coefficients": coefficients_dict,
    }
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=4)
    print(f"Metadata saved to {metadata_path}")
    print("Training finished successfully!")


if __name__ == "__main__":
    main()
