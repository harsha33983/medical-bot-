import pandas as pd
import numpy as np
import pickle
import os
import joblib
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

def train_models():
    print("Loading data...")
    # Paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, 'data')
    models_dir = os.path.join(base_dir, 'models')
    os.makedirs(models_dir, exist_ok=True)

    dataset_path = os.path.join(data_dir, 'dataset.csv')
    symptoms_pickle_path = os.path.join(data_dir, 'list_of_symptoms.pickle')

    df = pd.read_csv(dataset_path)
    
    with open(symptoms_pickle_path, 'rb') as f:
        symptoms_list = pickle.load(f)

    # The dataset has Disease, and Symptom_1 to Symptom_17
    # We need to create a binary feature matrix
    print("Preprocessing data...")
    
    # Strip whitespace from symptom values
    for col in df.columns:
        if df[col].dtype == 'object':
            df[col] = df[col].str.strip()

    X = pd.DataFrame(0, index=np.arange(len(df)), columns=symptoms_list)
    y = df['Disease']

    # Iterate over rows and set 1 for present symptoms
    # The symptoms in the dataset might have spaces or differ slightly, we need to map them properly.
    # From inspection, symptoms in dataset are like " itching", " skin_rash", etc.
    # And in pickle, they are "itching", "skin_rash".
    # We already stripped whitespace. Now we just set 1 if the symptom is in the list.
    
    for i, row in df.iterrows():
        for j in range(1, 18):
            symptom = row[f'Symptom_{j}']
            if pd.notna(symptom) and symptom != "":
                # Replace spaces with underscores if needed, though they seem to already have underscores
                # The pickle has 'dischromic_patches', dataset has 'dischromic _patches' (sometimes).
                # We will handle slight variations:
                symptom_cleaned = symptom.replace(' ', '_').replace('__', '_')
                
                # Try to find exact match
                if symptom_cleaned in symptoms_list:
                    X.loc[i, symptom_cleaned] = 1
                else:
                    # Let's try to match by removing spaces in both
                    for s_pickle in symptoms_list:
                        if s_pickle.replace('_', '') == symptom_cleaned.replace('_', ''):
                            X.loc[i, s_pickle] = 1
                            break

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training Decision Tree...")
    dt_clf = DecisionTreeClassifier(random_state=42)
    dt_clf.fit(X_train, y_train)
    dt_preds = dt_clf.predict(X_test)
    dt_acc = accuracy_score(y_test, dt_preds)
    print(f"Decision Tree Accuracy: {dt_acc}")

    print("Training SVC...")
    svc_clf = SVC(probability=True, random_state=42)
    svc_clf.fit(X_train, y_train)
    svc_preds = svc_clf.predict(X_test)
    svc_acc = accuracy_score(y_test, svc_preds)
    print(f"SVC Accuracy: {svc_acc}")

    # Save models
    joblib.dump(dt_clf, os.path.join(models_dir, 'decision_tree.joblib'))
    joblib.dump(svc_clf, os.path.join(models_dir, 'svc.joblib'))
    
    print("Models saved successfully.")

if __name__ == "__main__":
    train_models()
