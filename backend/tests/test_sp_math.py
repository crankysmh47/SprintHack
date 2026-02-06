import sys
from unittest.mock import MagicMock

# MOCK Dependencies to run test without installing Supabase/DotEnv
sys.modules["supabase"] = MagicMock()
sys.modules["dotenv"] = MagicMock()
sys.modules["os"] = MagicMock()

# Now import the engine
from backend.trust_engine import TrustEngine
import unittest

class TestSPMath(unittest.TestCase):
    def setUp(self):
        # Patch the Supabase client inside the module if needed, 
        # but since we mocked the library, the module level init won't crash.
        self.engine = TrustEngine()
        
        # Manually set an empty graph or mock it
        self.engine.graph = MagicMock()
        
        # Mock Trust Ranks (Everyone equal for this test, focusing on SP logic)
        self.engine.trust_ranks = {
            "user_1": 1.0, "user_2": 1.0, "user_3": 1.0, "user_4": 1.0, "user_5": 1.0, 
            "user_6": 1.0 # Added for safety
        }

    def test_obvious_truth(self):
        """
        Scenario: Everyone knows it's TRUE.
        Votes: TRUE
        Prediction: High TRUE
        """
        votes = [
            {"user_id": "user_1", "vote": True, "prediction": 0.9},
            {"user_id": "user_2", "vote": True, "prediction": 0.9},
            {"user_id": "user_3", "vote": True, "prediction": 0.8},
        ]
        result = self.engine.resolve_rumor("mock_id", votes)
        # Delta = 1.0 (Actual) - 0.86 (Predicted) = +0.14
        # Should be Verified
        self.assertEqual(result['status'], 'verified')
        self.assertEqual(result['verified_result'], True)
        print("\n✅ Obvious Truth Test Passed")

    def test_minority_truth_aka_philadelphia_problem(self):
        """
        Scenario: 'Is Philadelphia the capital of PA?'
        Fact: FALSE (It's Harrisburg).
        
        Crowd (Majority): Thinks TRUE (Wrong). Predicts TRUE (High).
        Experts (Minority): Votes FALSE (Right). Predicts TRUE (High).
        
        Why SP works: 
        - Predicted True % is HIGH (everyone knows people get this wrong).
        - Actual True % is LOWER than Predicted (because experts voted No).
        - Delta = Actual - Predicted < 0 -> FALSE.
        """
        votes = []
        
        # 3 Ignorant Users (Majority)
        # Vote: YES (True)
        # Predict: Most will say YES (0.8)
        for i in range(1, 4):
            votes.append({"user_id": f"user_{i}", "vote": True, "prediction": 0.9})
            
        # 2 Experts (Minority)
        # Vote: NO (False)
        # Predict: Most will say YES (0.8) - they know the crowd is wrong
        for i in range(4, 6):
            votes.append({"user_id": f"user_{i}", "vote": False, "prediction": 0.9})
            
        # Stats:
        # Total users: 5
        # Actual Vote True: 3/5 = 0.60
        # Avg Predicted True: 0.90
        # Delta = 0.60 - 0.90 = -0.30
        # Result should be FALSE (Disputed)
        
        result = self.engine.resolve_rumor("mock_id", votes)
        
        self.assertEqual(result['status'], 'disputed')
        self.assertEqual(result['verified_result'], False) # Correctly identified False despite majority voting True
        print(f"\n✅ Philadelphia Problem (Tyranny of Majority) Passed. Result: {result['status']}")

    def test_split_decision_uncertain(self):
        """
        Scenario: 50/50 split, prediction matches reality.
        """
        votes = [
            {"user_id": "user_1", "vote": True, "prediction": 0.5},
            {"user_id": "user_2", "vote": False, "prediction": 0.5},
            {"user_id": "user_3", "vote": True, "prediction": 0.5},
        ]
        # Actual: 0.66, Pred: 0.5
        # Delta: 0.16 -> Verified?
        
        # Let's try exact match
        votes = [
            {"user_id": "user_1", "vote": True, "prediction": 0.5},
            {"user_id": "user_2", "vote": False, "prediction": 0.5},
            {"user_id": "user_3", "vote": True, "prediction": 0.5},
            {"user_id": "user_4", "vote": False, "prediction": 0.5},
        ]
        # Actual: 0.5, Pred: 0.5, Delta: 0.0
        result = self.engine.resolve_rumor("mock_id", votes)
        self.assertEqual(result['status'], 'uncertain')
        print("\n✅ Uncertain Test Passed")

if __name__ == '__main__':
    unittest.main()
