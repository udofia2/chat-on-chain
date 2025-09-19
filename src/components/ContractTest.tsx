import React from 'react';
import { useContractTest } from '../hooks/useContractTest';
import { Button } from './ui/Button';
import { CheckCircle, XCircle, Clock, Play, Trash2 } from 'lucide-react';

export const ContractTest: React.FC = () => {
  const {
    testResults,
    isLoading,
    runAllTests,
    runEnsTests,
    runTokenTests,
    runFriendsTests,
    runGroupsTests,
    clearResults,
  } = useContractTest();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'error':
        return <XCircle className="text-red-500" size={16} />;
      case 'pending':
        return <Clock className="text-yellow-500 animate-spin" size={16} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Contract Integration Test
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Test smart contracts integration. Make sure your wallet is connected and you're on Sepolia testnet.
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={runAllTests}
              disabled={isLoading}
              className="flex items-center"
            >
              <Play size={16} className="mr-2" />
              Run All Tests
            </Button>
            
            <Button
              variant="outline"
              onClick={runEnsTests}
              disabled={isLoading}
            >
              Test ENS
            </Button>
            
            <Button
              variant="outline"
              onClick={runTokenTests}
              disabled={isLoading}
            >
              Test Tokens
            </Button>
            
            <Button
              variant="outline"
              onClick={runFriendsTests}
              disabled={isLoading}
            >
              Test Friends
            </Button>
            
            <Button
              variant="outline"
              onClick={runGroupsTests}
              disabled={isLoading}
            >
              Test Groups
            </Button>
            
            {testResults.length > 0 && (
              <Button
                variant="ghost"
                onClick={clearResults}
                disabled={isLoading}
                className="text-gray-500"
              >
                <Trash2 size={16} className="mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="p-6">
          {testResults.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-3">🧪</div>
              <p className="text-gray-500 dark:text-gray-400">
                No tests run yet. Click "Run All Tests" to start.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {result.test}
                        </h3>
                        {result.status === 'success' && result.result && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {typeof result.result === 'object' 
                              ? JSON.stringify(result.result, null, 2)
                              : result.result
                            }
                          </p>
                        )}
                        {result.status === 'error' && result.error && (
                          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                            Error: {result.error}
                          </p>
                        )}
                        {result.status === 'pending' && (
                          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                            Running test...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {testResults.length > 0 && (
          <div className="px-6 pb-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Test Summary
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-green-600 font-semibold">
                    {testResults.filter(r => r.status === 'success').length}
                  </div>
                  <div className="text-gray-500">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-red-600 font-semibold">
                    {testResults.filter(r => r.status === 'error').length}
                  </div>
                  <div className="text-gray-500">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-600 font-semibold">
                    {testResults.filter(r => r.status === 'pending').length}
                  </div>
                  <div className="text-gray-500">Running</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};