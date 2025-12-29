You are reviewing a hybrid time series forecasting system (ARIMAX + LSTM).
There is a conceptual bug in how MAPE is computed and compared.

Current issue:
- During training, Hybrid MAPE is calculated using TRAINING data
- ARIMAX MAPE is sometimes calculated using TEST data
- These values are later compared or displayed together, which is methodologically incorrect
- Training MAPE is being confused with evaluation (testing) MAPE

GOAL:
- Ensure that ALL MAPE values used for comparison between ARIMAX and Hybrid
  are computed on the SAME dataset: the TEST SET (evaluation data)
- Training MAPE may still exist but ONLY as an internal diagnostic
- Validation MAPE is ONLY for parameter selection, not final reporting

WHAT TO FIX:
1. In training logic:
   - Remove or clearly label Hybrid MAPE computed on training data
   - Do NOT return training MAPE as a performance comparison result
   - Training MAPE should be optional and diagnostic only

2. In evaluation logic (/evaluate endpoint):
   - Load the FINAL trained models (ARIMAX + LSTM)
   - Predict ONLY on test set
   - Compute:
       - ARIMAX_MAE/MAPE_test
       - HYBRID_MAE/MAPE_test
   - Return ONLY these values for evaluation

3. In Laravel / frontend:
   - Display ONLY MAPE computed from test set
   - Clearly label it as:
       "MAPE Data Uji (Evaluation)"
   - Do not mix training or validation MAPE in the comparison UI

4. Ensure terminology consistency:
   - "Training MAPE" → diagnostic only
   - "Validation MAPE" → parameter selection only
   - "Testing MAPE" == "Evaluation MAPE" → FINAL RESULT

EXPECTED OUTPUT:
- Refactored code or pseudo-code showing corrected MAPE flow
- Clear separation between training, validation, and evaluation metrics
- Comments explaining why training MAPE is not used for comparison
- No changes to model architecture unless necessary

IMPORTANT:
- Do NOT optimize for lower numbers
- Prioritize methodological correctness and academic validity
- Assume this will be used in a university thesis and examined by supervisors


Assume that incorrect comparison between training and testing metrics
would invalidate the thesis methodology.
Be strict and conservative in metric usage.
