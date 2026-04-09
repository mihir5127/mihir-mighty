import { useState, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import CarbonCalculator from './components/CarbonCalculator';
import EconomicFeasibility from './components/EconomicFeasibility';
import FinancialPlanning from './components/FinancialPlanning';
import type { BiocharResults, EconomicInputs, FinancialResults } from './types';
import { calculateBiochar } from './utils/calculations';
import { calculateFinancials } from './utils/financial';
import { DEFAULT_FEEDSTOCK, DEFAULT_PYROLYSIS, DEFAULT_ECONOMIC_INPUTS } from './utils/defaults';

export type TabId = 'dashboard' | 'carbon' | 'economic' | 'financial';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [feedstockParams, setFeedstockParams] = useState(DEFAULT_FEEDSTOCK);
  const [pyrolysisParams, setPyrolysisParams] = useState(DEFAULT_PYROLYSIS);
  const [economicInputs, setEconomicInputs] = useState<EconomicInputs>(DEFAULT_ECONOMIC_INPUTS);

  const biocharResults: BiocharResults = calculateBiochar(feedstockParams, pyrolysisParams);
  const financialResults: FinancialResults = calculateFinancials(economicInputs, biocharResults);

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'carbon', label: 'Carbon Calculator', icon: '🌿' },
    { id: 'economic', label: 'Economic Feasibility', icon: '💰' },
    { id: 'financial', label: 'Financial Planning', icon: '📈' },
  ];

  const handleNavigate = useCallback((tab: TabId) => setActiveTab(tab), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <header className="bg-green-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-3xl">🌱</span>
          <div>
            <h1 className="text-xl font-bold leading-tight">
              Biochar Carbon Credit Calculator
            </h1>
            <p className="text-green-200 text-xs">
              Economic & Financial Feasibility Platform
            </p>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-green-700 text-white shadow'
                    : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            biochar={biocharResults}
            financial={financialResults}
            economicInputs={economicInputs}
            onNavigate={handleNavigate}
          />
        )}
        {activeTab === 'carbon' && (
          <CarbonCalculator
            feedstock={feedstockParams}
            pyrolysis={pyrolysisParams}
            results={biocharResults}
            onFeedstockChange={setFeedstockParams}
            onPyrolysisChange={setPyrolysisParams}
          />
        )}
        {activeTab === 'economic' && (
          <EconomicFeasibility
            inputs={economicInputs}
            biochar={biocharResults}
            financial={financialResults}
            onChange={setEconomicInputs}
          />
        )}
        {activeTab === 'financial' && (
          <FinancialPlanning
            financial={financialResults}
            inputs={economicInputs}
            biochar={biocharResults}
            onChange={setEconomicInputs}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-green-900 text-green-200 text-center py-4 mt-8 text-xs">
        <p>
          Biochar Carbon Calculator · Based on IBI Standards, VERRA VM0044 &amp; Woolf et al.
          (2010) ·{' '}
          <span className="text-yellow-300">
            For indicative purposes only – consult a certified project developer for formal
            validation
          </span>
        </p>
      </footer>
    </div>
  );
}
