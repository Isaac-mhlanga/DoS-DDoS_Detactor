import { FiCpu, FiActivity, FiDatabase } from "react-icons/fi";

const MLModelView = ({ mlModelStatus }) => {
  return (
    <div className="p-4">
      <div className="bg-gray-800 rounded-xl p-4">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4 flex items-center">
          <FiCpu className="mr-3" /> Threat Detection AI Model
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Model Performance */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <FiActivity className="mr-2" /> Performance Metrics
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-gray-400">Detection Accuracy</p>
                <p className="text-2xl font-mono">
                  {mlModelStatus.accuracy.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-gray-400">False Positive Rate</p>
                <p className="text-2xl font-mono">
                  {mlModelStatus.falsePositives}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Response Latency</p>
                <p className="text-2xl font-mono">
                  {mlModelStatus.latency.toFixed(1)}ms
                </p>
              </div>
            </div>
          </div>

          {/* Model Details */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <FiDatabase className="mr-2" /> Model Details
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-gray-400">Model Version</p>
                <p className="text-xl font-mono">
                  {mlModelStatus.modelVersion}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Training Data</p>
                <p className="text-xl font-mono">
                  {mlModelStatus.trainingDataSize}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Last Trained</p>
                <p className="text-xl font-mono">
                  {mlModelStatus.lastTraining}
                </p>
              </div>
            </div>
          </div>

          {/* Detection Features */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">
              Detection Capabilities
            </h3>
            <ul className="space-y-2">
              {mlModelStatus.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-cyan-400 mr-2">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLModelView;
