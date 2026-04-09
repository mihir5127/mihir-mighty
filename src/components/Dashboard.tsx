import type { BiocharResults, EconomicInputs, FinancialResults } from '../types';
import type { TabId } from '../App';
import { formatCurrency, formatNum } from '../utils/financial';

interface Props {
  biochar: BiocharResults;
  financial: FinancialResults;
  economicInputs: EconomicInputs;
  onNavigate: (tab: TabId) => void;
}

export default function Dashboard({ biochar, financial, onNavigate }: Props) {
  const metrics = [
    {
      label: 'Net Carbon Credits',
      value: `${formatNum(biochar.netCarbonCredits, 1)} t CO₂e/yr`,
      icon: '🌍',
      color: 'bg-emerald-50 border-emerald-200',
      textColor: 'text-emerald-700',
    },
    {
      label: 'Biochar Yield',
      value: `${formatNum(biochar.biocharYield, 1)} t/yr`,
      icon: '⚗️',
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-700',
    },
    {
      label: 'Annual Revenue',
      value: formatCurrency(financial.annualRevenue),
      icon: '💵',
      color: 'bg-teal-50 border-teal-200',
      textColor: 'text-teal-700',
    },
    {
      label: 'Net Present Value',
      value: formatCurrency(financial.npv),
      icon: '📈',
      color: financial.npv >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200',
      textColor: financial.npv >= 0 ? 'text-blue-700' : 'text-red-600',
    },
    {
      label: 'IRR',
      value: `${formatNum(financial.irr, 1)}%`,
      icon: '🎯',
      color: financial.irr >= 10 ? 'bg-purple-50 border-purple-200' : 'bg-orange-50 border-orange-200',
      textColor: financial.irr >= 10 ? 'text-purple-700' : 'text-orange-600',
    },
    {
      label: 'Payback Period',
      value:
        financial.paybackPeriod > 0
          ? `${formatNum(financial.paybackPeriod, 1)} yrs`
          : 'N/A',
      icon: '⏱️',
      color: 'bg-yellow-50 border-yellow-200',
      textColor: 'text-yellow-700',
    },
    {
      label: 'EBITDA Margin',
      value: `${formatNum(financial.ebitdaMargin, 1)}%`,
      icon: '📊',
      color: financial.ebitdaMargin >= 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-red-50 border-red-200',
      textColor: financial.ebitdaMargin >= 0 ? 'text-indigo-700' : 'text-red-600',
    },
    {
      label: 'Total CapEx',
      value: formatCurrency(financial.totalCapex),
      icon: '🏭',
      color: 'bg-gray-50 border-gray-200',
      textColor: 'text-gray-700',
    },
  ];

  const quickLinks: { tab: TabId; label: string; desc: string; icon: string }[] = [
    { tab: 'carbon', label: 'Carbon Calculator', desc: 'Calculate biochar yield & CO₂e sequestration', icon: '🌿' },
    { tab: 'economic', label: 'Economic Feasibility', desc: 'Set CapEx, OpEx & revenue parameters', icon: '💰' },
    { tab: 'financial', label: 'Financial Planning', desc: 'NPV, IRR, cash flows & sensitivity analysis', icon: '📈' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-600 rounded-2xl text-white p-8 shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-5xl">🌱</span>
          <div>
            <h2 className="text-2xl font-bold">Biochar Carbon Credit Project</h2>
            <p className="text-green-100 mt-1">
              Integrated Carbon Calculator &amp; Financial Feasibility Platform
            </p>
          </div>
        </div>
        <p className="text-green-50 text-sm leading-relaxed max-w-3xl">
          This tool helps you evaluate the viability of a biochar production project for generating
          carbon credits. Input your feedstock, pyrolysis process parameters, and economic
          assumptions to get a comprehensive analysis including carbon sequestration potential,
          NPV, IRR, payback period, and sensitivity analysis.
        </p>
      </div>

      {/* KPI Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">📌 Key Performance Indicators</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className={`${m.color} border rounded-xl p-4 text-center shadow-sm`}
            >
              <div className="text-2xl mb-1">{m.icon}</div>
              <div className={`text-xl font-bold ${m.textColor}`}>{m.value}</div>
              <div className="text-xs text-gray-500 mt-1">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Carbon Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="section-title">🌿 Carbon Sequestration Summary</h3>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {[
                ['Biochar Yield', `${formatNum(biochar.biocharYield, 1)} t/yr (${formatNum(biochar.biocharYieldPct, 1)}% of dry feed)`],
                ['Carbon in Biochar', `${formatNum(biochar.carbonInBiochar, 1)} t C/yr`],
                ['Biochar Stability', `${formatNum(biochar.biocharStability, 1)}%`],
                ['Permanent C Sequestered', `${formatNum(biochar.permanentCarbonSeq, 1)} t C/yr`],
                ['Gross CO₂e Sequestered', `${formatNum(biochar.co2eSeq, 1)} t CO₂e/yr`],
                ['Process Emissions', `−${formatNum(biochar.processEmissions, 1)} t CO₂e/yr`],
                ['Net Carbon Credits', `${formatNum(biochar.netCarbonCredits, 1)} t CO₂e/yr`],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td className="py-2 text-gray-600">{k}</td>
                  <td className="py-2 font-medium text-right text-green-800">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 className="section-title">💰 Financial Summary</h3>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {[
                ['Total CapEx', formatCurrency(financial.totalCapex)],
                ['Annual Revenue (Yr 1)', formatCurrency(financial.annualRevenue)],
                ['Annual OpEx (Yr 1)', formatCurrency(financial.annualOpex)],
                ['EBITDA (Yr 1)', formatCurrency(financial.annualEbitda)],
                ['EBITDA Margin', `${formatNum(financial.ebitdaMargin, 1)}%`],
                ['NPV (20 yr)', formatCurrency(financial.npv)],
                ['IRR', `${formatNum(financial.irr, 1)}%`],
                ['Payback Period', financial.paybackPeriod > 0 ? `${formatNum(financial.paybackPeriod, 1)} years` : 'N/A'],
                ['ROI', `${formatNum(financial.roiPct, 1)}%`],
                ['Levelised Cost (Biochar)', `${formatCurrency(financial.lcoBiochar, 2)}/t`],
                ['Levelised Cost (Carbon Credit)', `${formatCurrency(financial.lcoCarbonCredit, 2)}/t CO₂e`],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td className="py-1.5 text-gray-600">{k}</td>
                  <td className={`py-1.5 font-medium text-right ${
                    typeof v === 'string' && v.startsWith('-') ? 'text-red-500' : 'text-green-800'
                  }`}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Navigation */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">🔗 Quick Navigation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickLinks.map((ql) => (
            <button
              key={ql.tab}
              onClick={() => onNavigate(ql.tab)}
              className="bg-white border border-green-200 rounded-xl p-5 text-left hover:bg-green-50 hover:border-green-400 transition-all shadow-sm group"
            >
              <div className="text-3xl mb-2">{ql.icon}</div>
              <div className="font-semibold text-green-800 group-hover:text-green-900">
                {ql.label}
              </div>
              <div className="text-sm text-gray-500 mt-1">{ql.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Viability Badge */}
      <div className={`rounded-xl p-4 flex items-center gap-3 ${
        financial.npv > 0 && financial.irr > 10
          ? 'bg-green-100 border border-green-300'
          : financial.npv > 0
          ? 'bg-yellow-50 border border-yellow-300'
          : 'bg-red-50 border border-red-300'
      }`}>
        <span className="text-2xl">
          {financial.npv > 0 && financial.irr > 10 ? '✅' : financial.npv > 0 ? '⚠️' : '❌'}
        </span>
        <div>
          <div className={`font-semibold ${
            financial.npv > 0 && financial.irr > 10
              ? 'text-green-800'
              : financial.npv > 0
              ? 'text-yellow-800'
              : 'text-red-700'
          }`}>
            {financial.npv > 0 && financial.irr > 10
              ? 'Project Appears Financially Viable'
              : financial.npv > 0
              ? 'Project Marginally Viable – Review Assumptions'
              : 'Project May Not Be Viable – Adjust Parameters'}
          </div>
          <div className="text-sm text-gray-600 mt-0.5">
            NPV: {formatCurrency(financial.npv)} · IRR: {formatNum(financial.irr, 1)}% ·
            Payback: {financial.paybackPeriod > 0 ? `${formatNum(financial.paybackPeriod, 1)} yrs` : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
}
