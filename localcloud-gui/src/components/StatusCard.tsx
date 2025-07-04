import { LocalStackStatus } from "@/types";
import {
  CheckCircleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface StatusCardProps {
  status: LocalStackStatus;
}

export default function StatusCard({ status }: StatusCardProps) {
  const getStatusIcon = () => {
    switch (status.health) {
      case "healthy":
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case "unhealthy":
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      default:
        return <QuestionMarkCircleIcon className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status.health) {
      case "healthy":
        return "text-green-600 bg-green-50 border-green-200";
      case "unhealthy":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusText = () => {
    if (!status.running) return "Stopped";
    switch (status.health) {
      case "healthy":
        return "Running";
      case "unhealthy":
        return "Unhealthy";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-medium text-gray-900">LocalStack</h3>
            <p className="text-sm text-gray-500">{status.endpoint}</p>
          </div>
        </div>
        <div className="text-right">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor()}`}
          >
            {getStatusText()}
          </span>
        </div>
      </div>

      {status.running && status.uptime && (
        <div className="mt-4 flex items-center text-sm text-gray-500">
          <ClockIcon className="h-4 w-4 mr-2" />
          Uptime: {status.uptime}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <dt className="text-sm font-medium text-gray-500">Status</dt>
          <dd className="mt-1 text-sm text-gray-900">{getStatusText()}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Health</dt>
          <dd className="mt-1 text-sm text-gray-900 capitalize">
            {status.health}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Endpoint</dt>
          <dd className="mt-1 text-sm text-gray-900 font-mono">
            {status.endpoint}
          </dd>
        </div>
      </div>
    </div>
  );
}
