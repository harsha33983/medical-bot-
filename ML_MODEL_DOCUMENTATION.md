# Machine Learning Model Documentation

## Features
The models use a binary feature vector representation. 
The length of the vector is 132, corresponding to the 132 unique symptoms found in `list_of_symptoms.pickle`. 
For any given sample, if a symptom is present, its corresponding index in the vector is set to 1, otherwise 0.

## Target
The target variable is the `Disease` string (e.g., "Fungal infection", "Malaria").

## Preprocessing
- Stripped leading/trailing whitespaces from dataset values.
- Replaced spaces with underscores where applicable to match symptom names between the main dataset and the pickled symptom list.
- Transformed rows containing variable lists of symptoms into a standardized binary matrix.

## Decision Tree
- Algorithm: `DecisionTreeClassifier(random_state=42)`
- Performs classification by splitting the feature space based on symptom presence.
- Achieved **1.0 (100%) accuracy** on the test set.

## Support Vector Classifier (SVC)
- Algorithm: `SVC(probability=True, random_state=42)`
- Finds the optimal hyperplane that separates the disease classes in the 132-dimensional symptom space.
- Achieved **1.0 (100%) accuracy** on the test set.
- Note: This model is used as the primary prediction engine in the backend API.

## Evaluation
- Train/Test Split: 80% / 20%
- Metric: Accuracy (`accuracy_score`)

## Prediction Pipeline
1. User provides a list of text symptoms.
2. Symptoms are normalized and mapped to the 132-length binary vector.
3. Vector is passed to the loaded `SVC` model.
4. Model outputs the predicted string.
5. The string is used to look up Description, Precautions, and Severity in the auxiliary datasets.
