"use client"

const PredictionCard = ({ prediction }) => {
  if (!prediction) return null;

  // Determine the color based on the category
  let categoryColor = "text-yellow-500";
  if (prediction.category === "Almost guaranteed") {
    categoryColor = "text-green-500";
  } else if (prediction.category === "Riskey") {
    categoryColor = "text-red-500";
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-4">Scoring Prediction</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-700 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">Threshold</p>
          <p className="text-2xl font-bold">{prediction.threshold} pts</p>
        </div>
        <div className="bg-gray-700 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">Probability</p>
          <p className="text-2xl font-bold">{prediction.probability}</p>
        </div>
      </div>
      
      <div className="bg-gray-700 p-4 rounded-lg mb-4">
        <p className="text-gray-400 text-sm mb-1">Recommendation</p>
        <p className={`text-xl font-bold ${categoryColor}`}>{prediction.category}</p>
      </div>
      
      <div className="bg-gray-700 p-4 rounded-lg">
        <p className="text-gray-400 text-sm mb-1">Statistical Probability</p>
        <p className="text-lg">
          Based on Poisson distribution: <span className="font-bold">{prediction.poissonProbability}</span>
        </p>
        <p className="text-sm text-gray-400 mt-2">
          This is the mathematical probability of scoring above the threshold based on the player's season average.
        </p>
      </div>
    </div>
  );
};

export default PredictionCard;