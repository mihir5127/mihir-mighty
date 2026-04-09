import type { EconomicInputs, BiocharResults, FinancialResults } from '../types';
import { runSensitivityAnalysis } from '../utils/financial';
import { formatCurrency, formatNum } from '../utils/financial';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';

interface Props {
  financial: FinancialResults;
  inputs: EconomicInputs;
  biochar: BiocharResults;
  onChange: (i: EconomicInputs) => void;
}

export default function FinancialPlanning({ financial, inputs, biochar }: Props) {
  const sensitivity = runSensitivityAnalysis(inputs, biochar);

  // Cash flow chart data
  const cashFlowData = financial.cashFlows.map((cf) => ({
    year: `Yr ${cf.year}`,
    Revenue: Math.round(cf.revenue),
    OpEx: Math.round(cf.opex),
    EBITDA: Math.round(cf.ebitda),
    'Net Cash Flow': Math.round(cf.cashFlow),
    'Cumulative CF': Math.round(cf.cumulativeCashFlow),
    'NPV Cumulative': Math.round(cf.npvCumulative),
  }));

  // Sensitivity waterfall data for NPV
  const sensitivityData = sensitivity.map((s) => ({
    variable: s.variable,
    low: s.npvLow,
    base: s.npvBase,
    high: s.npvHigh,
    range: Math.abs(s.npvHigh - s.npvLow),
  })).sort((a, b) => b.range - a.range);

  const paybackOk = financial.paybackPeriod > 0 && financial.paybackPeriod <= inputs.projectLife;

  return (
    <div className="space-y-6">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {
            label: 'NPV',
            value: formatCurrency(financial.npv),
            color: financial.npv >= 0 ? 'text-green-700' : 'text-red-500',
            tooltip: `Net Present Value over ${inputs.projectLife} years at ${inputs.discountRate}% discount rate`,
          },
          {
            label: 'IRR',
            value: `${formatNum(financial.irr, 1)}%`,
            color: financial.irr >= inputs.discountRate ? 'text-green-700' : 'text-red-500',
            tooltip: 'Internal Rate of Return',
          },
          {
            label: 'Payback Period',
            value: paybackOk ? `${formatNum(financial.paybackPeriod, 1)} yrs` : 'N/A',
            color: paybackOk ? 'text-green-700' : 'text-orange-500',
            tooltip: 'Simple payback period (undiscounted)',
          },
          {
            label: 'ROI',
            value: `${formatNum(financial.roiPct, 1)}%`,
            color: financial.roiPct >= 0 ? 'text-green-700' : 'text-red-500',
            tooltip: `Return on Investment over ${inputs.projectLife} years`,
          },
          {
            label: 'Break-even CO₂e',
            value: `${formatNum(financial.breakEvenTonnes, 0)} t/yr`,
            color: biochar.netCarbonCredits >= financial.breakEvenTonnes ? 'text-green-700' : 'text-orange-500',
            tooltip: 'Minimum carbon credits needed to cover OpEx',
          },
        ].map((m) => (
          <div key={m.label} className="metric-card" title={m.tooltip}>
            <div className={`metric-value ${m.color}`}>{m.value}</div>
            <div className="metric-label">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Cumulative Cash Flow & NPV */}
      <div className="card">
        <h3 className="section-title">📈 Cumulative Cash Flow & NPV Profile</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={cashFlowData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="cfGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="npvGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
            <Tooltip
              formatter={(v, name) => [formatCurrency(Number(v ?? 0)), name]}
            />
            <Legend />
            <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="Cumulative CF"
              stroke="#16a34a"
              fill="url(#cfGrad)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="NPV Cumulative"
              stroke="#0284c7"
              fill="url(#npvGrad)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Annual Revenue & Cost */}
      <div className="card">
        <h3 className="section-title">💰 Annual Revenue, OpEx &amp; Net Cash Flow</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={cashFlowData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v, name) => [formatCurrency(Number(v ?? 0)), name]} />
            <Legend />
            <ReferenceLine y={0} stroke="#9ca3af" />
            <Bar dataKey="Revenue" fill="#16a34a" radius={[2, 2, 0, 0]} />
            <Bar dataKey="OpEx" fill="#f97316" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Net Cash Flow" fill="#0284c7" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* EBITDA Line */}
      <div className="card">
        <h3 className="section-title">📊 EBITDA Progression (inflation-adjusted)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={cashFlowData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v) => [formatCurrency(Number(v ?? 0)), 'EBITDA']} />
            <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="EBITDA"
              stroke="#16a34a"
              strokeWidth={2}
              dot={{ r: 3, fill: '#16a34a' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sensitivity Analysis */}
      <div className="card">
        <h3 className="section-title">🔬 Sensitivity Analysis – NPV Impact (±20% change)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-2 px-3 font-semibold text-gray-600">Variable</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-600">NPV (−20%)</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-600">NPV (Base)</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-600">NPV (+20%)</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-600">IRR (−20%)</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-600">IRR Base</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-600">IRR (+20%)</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-600">Sensitivity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sensitivity.map((s) => {
                const range = Math.abs(s.npvHigh - s.npvLow);
                const maxRange = Math.max(...sensitivity.map(x => Math.abs(x.npvHigh - x.npvLow)));
                const barPct = maxRange > 0 ? (range / maxRange) * 100 : 0;
                return (
                  <tr key={s.variable} className="hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium text-gray-700">{s.variable}</td>
                    <td className={`py-2 px-3 text-right ${s.npvLow >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {formatCurrency(s.npvLow)}
                    </td>
                    <td className={`py-2 px-3 text-right font-semibold ${s.npvBase >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {formatCurrency(s.npvBase)}
                    </td>
                    <td className={`py-2 px-3 text-right ${s.npvHigh >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {formatCurrency(s.npvHigh)}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-600">{formatNum(s.irrLow, 1)}%</td>
                    <td className="py-2 px-3 text-right font-semibold text-gray-700">{formatNum(s.irrBase, 1)}%</td>
                    <td className="py-2 px-3 text-right text-gray-600">{formatNum(s.irrHigh, 1)}%</td>
                    <td className="py-2 px-3">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Tornado Chart */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">
            Tornado Chart – NPV Range by Variable (±20%)
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              layout="vertical"
              data={sensitivityData}
              margin={{ top: 5, right: 20, left: 120, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="variable" tick={{ fontSize: 11 }} width={115} />
              <Tooltip
                formatter={(v, name) => [formatCurrency(Number(v ?? 0)), String(name) === 'low' ? '−20% scenario NPV' : '+20% scenario NPV']}
              />
              <Legend />
              <Bar dataKey="low" name="Low (−20%)" radius={[0, 4, 4, 0]}>
                {sensitivityData.map((_, i) => (
                  <Cell key={i} fill={sensitivityData[i].low >= 0 ? '#4ade80' : '#fca5a5'} />
                ))}
              </Bar>
              <Bar dataKey="high" name="High (+20%)" radius={[0, 4, 4, 0]}>
                {sensitivityData.map((_, i) => (
                  <Cell key={i} fill={sensitivityData[i].high >= 0 ? '#16a34a' : '#ef4444'} />
                ))}
              </Bar>
              <ReferenceLine x={0} stroke="#374151" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Cash Flow Table */}
      <div className="card">
        <h3 className="section-title">📋 Detailed Annual Cash Flow Table</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-green-50">
                {['Year', 'Revenue', 'OpEx', 'EBITDA', 'Depreciation', 'EBIT', 'Tax', 'Net Cash Flow', 'Cumulative CF', 'NPV Cumulative'].map(
                  (h) => (
                    <th key={h} className="text-right py-2 px-2 font-semibold text-gray-600 first:text-left">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="bg-gray-50">
                <td className="py-1.5 px-2 font-medium text-gray-700">0 (CapEx)</td>
                <td className="py-1.5 px-2 text-right">—</td>
                <td className="py-1.5 px-2 text-right">—</td>
                <td className="py-1.5 px-2 text-right">—</td>
                <td className="py-1.5 px-2 text-right">—</td>
                <td className="py-1.5 px-2 text-right">—</td>
                <td className="py-1.5 px-2 text-right">—</td>
                <td className="py-1.5 px-2 text-right text-red-500">{formatCurrency(-financial.totalCapex)}</td>
                <td className="py-1.5 px-2 text-right text-red-500">{formatCurrency(-financial.totalCapex)}</td>
                <td className="py-1.5 px-2 text-right text-red-500">{formatCurrency(-financial.totalCapex)}</td>
              </tr>
              {financial.cashFlows.map((cf) => (
                <tr key={cf.year} className="hover:bg-gray-50">
                  <td className="py-1.5 px-2 font-medium text-gray-700">{cf.year}</td>
                  <td className="py-1.5 px-2 text-right text-green-700">{formatCurrency(cf.revenue)}</td>
                  <td className="py-1.5 px-2 text-right text-orange-600">{formatCurrency(cf.opex)}</td>
                  <td className={`py-1.5 px-2 text-right ${cf.ebitda >= 0 ? 'text-green-700' : 'text-red-500'}`}>{formatCurrency(cf.ebitda)}</td>
                  <td className="py-1.5 px-2 text-right text-gray-500">{formatCurrency(cf.depreciation)}</td>
                  <td className={`py-1.5 px-2 text-right ${cf.ebit >= 0 ? 'text-green-700' : 'text-red-500'}`}>{formatCurrency(cf.ebit)}</td>
                  <td className="py-1.5 px-2 text-right text-gray-500">{formatCurrency(cf.tax)}</td>
                  <td className={`py-1.5 px-2 text-right font-medium ${cf.cashFlow >= 0 ? 'text-green-700' : 'text-red-500'}`}>{formatCurrency(cf.cashFlow)}</td>
                  <td className={`py-1.5 px-2 text-right font-medium ${cf.cumulativeCashFlow >= 0 ? 'text-green-700' : 'text-red-500'}`}>{formatCurrency(cf.cumulativeCashFlow)}</td>
                  <td className={`py-1.5 px-2 text-right font-medium ${cf.npvCumulative >= 0 ? 'text-blue-600' : 'text-red-500'}`}>{formatCurrency(cf.npvCumulative)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assumptions Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h3 className="font-semibold text-amber-800 mb-2">⚠️ Key Assumptions</h3>
        <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
          <li>Discount rate: {inputs.discountRate}% p.a. (WACC approximation)</li>
          <li>Inflation: {inputs.inflationRate}% p.a. applied to both revenue and costs</li>
          <li>Corporate tax rate: {inputs.taxRate}% on taxable income (EBIT)</li>
          <li>Straight-line depreciation over {inputs.depreciationYears} years</li>
          <li>Carbon credit verification, permanence and additionality assumed compliant with VERRA VM0044</li>
          <li>No working capital or residual value modelled (conservative approach)</li>
          <li>All values in nominal USD unless otherwise stated</li>
        </ul>
      </div>
    </div>
  );
}
