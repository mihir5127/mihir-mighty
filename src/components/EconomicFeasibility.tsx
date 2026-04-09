import type { EconomicInputs, BiocharResults, FinancialResults } from '../types';
import { formatCurrency, formatNum } from '../utils/financial';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface Props {
  inputs: EconomicInputs;
  biochar: BiocharResults;
  financial: FinancialResults;
  onChange: (i: EconomicInputs) => void;
}

function NumberInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  min,
  max,
  step,
  tooltip,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  tooltip?: string;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        {prefix && <span className="text-gray-500 text-sm">{prefix}</span>}
        <input
          type="number"
          className="input-field"
          value={value}
          min={min}
          max={max}
          step={step ?? 1}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {suffix && <span className="text-gray-500 text-sm">{suffix}</span>}
      </div>
      {tooltip && <p className="tooltip-box">{tooltip}</p>}
    </div>
  );
}

export default function EconomicFeasibility({ inputs, biochar, financial, onChange }: Props) {
  function updateCapex<K extends keyof typeof inputs.capex>(k: K, v: number) {
    onChange({ ...inputs, capex: { ...inputs.capex, [k]: v } });
  }
  function updateOpex<K extends keyof typeof inputs.opex>(k: K, v: number) {
    onChange({ ...inputs, opex: { ...inputs.opex, [k]: v } });
  }
  function updateRevenue<K extends keyof typeof inputs.revenue>(k: K, v: number) {
    onChange({ ...inputs, revenue: { ...inputs.revenue, [k]: v } });
  }
  function updateField<K extends keyof EconomicInputs>(k: K, v: EconomicInputs[K]) {
    onChange({ ...inputs, [k]: v });
  }

  // CapEx breakdown for pie chart
  const capexBreakdown = [
    { name: 'Pyrolysis Unit', value: inputs.capex.pyrolysisUnit },
    { name: 'Feedstock Handling', value: inputs.capex.feedstockHandling },
    { name: 'Biochar Storage', value: inputs.capex.biocharStorage },
    { name: 'Gas Treatment', value: inputs.capex.gasTreatment },
    { name: 'Land & Civil', value: inputs.capex.landAndCivil },
    { name: 'Electrical & Control', value: inputs.capex.electricalAndControl },
    { name: 'Contingency', value: financial.totalCapex - (
      inputs.capex.pyrolysisUnit +
      inputs.capex.feedstockHandling +
      inputs.capex.biocharStorage +
      inputs.capex.gasTreatment +
      inputs.capex.landAndCivil +
      inputs.capex.electricalAndControl
    )},
  ].filter(d => d.value > 0);

  const COLORS = ['#16a34a','#22c55e','#4ade80','#86efac','#bbf7d0','#064e3b','#166534'];

  // Revenue breakdown
  const revenueBreakdown = [
    { name: 'Carbon Credits', value: biochar.netCarbonCredits * inputs.revenue.carbonCreditPrice },
    { name: 'Biochar Sales', value: biochar.biocharYield * inputs.revenue.biocharPrice * inputs.revenue.biocharSalesFraction },
    { name: 'Syngas/Heat', value: (inputs.revenue.syngasRevenue ?? 0) + (inputs.revenue.heatRevenue ?? 0) },
  ].filter(d => d.value > 0);

  const REV_COLORS = ['#0284c7','#0ea5e9','#38bdf8'];

  // Opex breakdown
  const opexBreakdown = [
    { name: 'Feedstock', value: biochar.biocharYield / 0.3 * inputs.opex.feedstockCost },
    { name: 'Labor', value: inputs.opex.laborCost },
    { name: 'Maintenance', value: financial.totalCapex * inputs.opex.maintenancePct / 100 },
    { name: 'Transport', value: biochar.biocharYield * inputs.opex.transportCost },
    { name: 'Certification', value: inputs.opex.certificationCost },
    { name: 'Misc', value: inputs.opex.miscOpex },
  ].filter(d => d.value > 0);

  const OPEX_COLORS = ['#f97316','#fb923c','#fdba74','#fcd34d','#fde68a','#fef3c7'];

  const revenueVsOpex = [
    { name: 'Carbon Credits', revenue: biochar.netCarbonCredits * inputs.revenue.carbonCreditPrice, opex: 0 },
    { name: 'Biochar Sales', revenue: biochar.biocharYield * inputs.revenue.biocharPrice * inputs.revenue.biocharSalesFraction, opex: 0 },
    { name: 'By-products', revenue: (inputs.revenue.syngasRevenue ?? 0) + (inputs.revenue.heatRevenue ?? 0), opex: 0 },
    { name: 'Total OpEx', revenue: 0, opex: financial.annualOpex },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CapEx */}
        <div className="card">
          <h2 className="section-title">🏭 Capital Expenditure (CapEx)</h2>
          <NumberInput label="Pyrolysis Unit ($)" value={inputs.capex.pyrolysisUnit} onChange={(v) => updateCapex('pyrolysisUnit', v)} prefix="$" min={0} step={10000} />
          <NumberInput label="Feedstock Handling ($)" value={inputs.capex.feedstockHandling} onChange={(v) => updateCapex('feedstockHandling', v)} prefix="$" min={0} step={5000} />
          <NumberInput label="Biochar Storage ($)" value={inputs.capex.biocharStorage} onChange={(v) => updateCapex('biocharStorage', v)} prefix="$" min={0} step={5000} />
          <NumberInput label="Gas Treatment ($)" value={inputs.capex.gasTreatment} onChange={(v) => updateCapex('gasTreatment', v)} prefix="$" min={0} step={5000} />
          <NumberInput label="Land & Civil Works ($)" value={inputs.capex.landAndCivil} onChange={(v) => updateCapex('landAndCivil', v)} prefix="$" min={0} step={10000} />
          <NumberInput label="Electrical & Control ($)" value={inputs.capex.electricalAndControl} onChange={(v) => updateCapex('electricalAndControl', v)} prefix="$" min={0} step={5000} />
          <NumberInput label="Contingency (%)" value={inputs.capex.contingency} onChange={(v) => updateCapex('contingency', v)} suffix="%" min={0} max={50} step={1} tooltip="Applied as % of sub-total CapEx" />
          <div className="mt-2 bg-green-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-green-800">{formatCurrency(financial.totalCapex)}</div>
            <div className="text-xs text-gray-500">Total CapEx (incl. contingency)</div>
          </div>
        </div>

        {/* OpEx */}
        <div className="card">
          <h2 className="section-title">⚙️ Operating Expenditure (OpEx)</h2>
          <NumberInput label="Feedstock Cost ($/dry tonne)" value={inputs.opex.feedstockCost} onChange={(v) => updateOpex('feedstockCost', v)} prefix="$" suffix="/t" min={0} step={5} tooltip="Cost of purchasing/harvesting feedstock" />
          <NumberInput label="Labor ($/year)" value={inputs.opex.laborCost} onChange={(v) => updateOpex('laborCost', v)} prefix="$" min={0} step={5000} />
          <NumberInput label="Maintenance (% CapEx/yr)" value={inputs.opex.maintenancePct} onChange={(v) => updateOpex('maintenancePct', v)} suffix="%" min={0} max={20} step={0.5} />
          <NumberInput label="Energy Cost ($/kWh)" value={inputs.opex.energyCost} onChange={(v) => updateOpex('energyCost', v)} prefix="$" suffix="/kWh" min={0} step={0.01} />
          <NumberInput label="Transport ($/tonne biochar)" value={inputs.opex.transportCost} onChange={(v) => updateOpex('transportCost', v)} prefix="$" suffix="/t" min={0} step={1} />
          <NumberInput label="Certification ($/year)" value={inputs.opex.certificationCost} onChange={(v) => updateOpex('certificationCost', v)} prefix="$" min={0} step={1000} tooltip="MRV, auditing, registry fees" />
          <NumberInput label="Miscellaneous ($/year)" value={inputs.opex.miscOpex} onChange={(v) => updateOpex('miscOpex', v)} prefix="$" min={0} step={1000} />
          <div className="mt-2 bg-orange-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-orange-700">{formatCurrency(financial.annualOpex)}</div>
            <div className="text-xs text-gray-500">Annual OpEx (Year 1)</div>
          </div>
        </div>

        {/* Revenue */}
        <div className="card">
          <h2 className="section-title">💵 Revenue Streams</h2>
          <NumberInput
            label="Carbon Credit Price ($/t CO₂e)"
            value={inputs.revenue.carbonCreditPrice}
            onChange={(v) => updateRevenue('carbonCreditPrice', v)}
            prefix="$"
            suffix="/t CO₂e"
            min={0}
            step={5}
            tooltip={`At ${formatCurrency(inputs.revenue.carbonCreditPrice)}/t CO₂e × ${formatNum(biochar.netCarbonCredits, 1)} t credits = ${formatCurrency(biochar.netCarbonCredits * inputs.revenue.carbonCreditPrice)}/yr`}
          />
          <NumberInput
            label="Biochar Selling Price ($/tonne)"
            value={inputs.revenue.biocharPrice}
            onChange={(v) => updateRevenue('biocharPrice', v)}
            prefix="$"
            suffix="/t"
            min={0}
            step={10}
          />
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Biochar Sold (vs. on-farm use): {Math.round(inputs.revenue.biocharSalesFraction * 100)}%
            </label>
            <input
              type="range"
              className="w-full accent-green-600"
              min={0}
              max={1}
              step={0.05}
              value={inputs.revenue.biocharSalesFraction}
              onChange={(e) => updateRevenue('biocharSalesFraction', Number(e.target.value))}
            />
          </div>
          <NumberInput label="Syngas/Co-product Revenue ($/yr)" value={inputs.revenue.syngasRevenue ?? 0} onChange={(v) => updateRevenue('syngasRevenue', v)} prefix="$" min={0} step={1000} />
          <NumberInput label="Heat/Energy Revenue ($/yr)" value={inputs.revenue.heatRevenue} onChange={(v) => updateRevenue('heatRevenue', v)} prefix="$" min={0} step={1000} />

          {/* Project Parameters */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Project Parameters</h3>
            <NumberInput label="Project Life (years)" value={inputs.projectLife} onChange={(v) => updateField('projectLife', v)} min={5} max={30} step={1} />
            <NumberInput label="Discount Rate (%)" value={inputs.discountRate} onChange={(v) => updateField('discountRate', v)} suffix="%" min={1} max={30} step={0.5} />
            <NumberInput label="Inflation Rate (%)" value={inputs.inflationRate} onChange={(v) => updateField('inflationRate', v)} suffix="%" min={0} max={10} step={0.5} />
            <NumberInput label="Corporate Tax Rate (%)" value={inputs.taxRate} onChange={(v) => updateField('taxRate', v)} suffix="%" min={0} max={50} step={1} />
            <NumberInput label="Depreciation Period (years)" value={inputs.depreciationYears} onChange={(v) => updateField('depreciationYears', v)} min={3} max={20} step={1} />
          </div>

          <div className="mt-2 bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-blue-700">{formatCurrency(financial.annualRevenue)}</div>
            <div className="text-xs text-gray-500">Annual Revenue (Year 1)</div>
          </div>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'EBITDA (Yr 1)', value: formatCurrency(financial.annualEbitda), color: financial.annualEbitda >= 0 ? 'text-green-700' : 'text-red-500' },
          { label: 'EBITDA Margin', value: `${formatNum(financial.ebitdaMargin, 1)}%`, color: financial.ebitdaMargin >= 0 ? 'text-green-700' : 'text-red-500' },
          { label: 'Break-even Credits', value: `${formatNum(financial.breakEvenTonnes, 0)} t CO₂e/yr`, color: 'text-orange-600' },
          { label: 'Levelised Biochar Cost', value: `${formatCurrency(financial.lcoBiochar, 2)}/t`, color: 'text-gray-700' },
        ].map(m => (
          <div key={m.label} className="metric-card">
            <div className={`metric-value ${m.color}`}>{m.value}</div>
            <div className="metric-label">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="section-title">CapEx Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={capexBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                {capexBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => [formatCurrency(Number(v ?? 0)), '']} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="section-title">OpEx Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={opexBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                {opexBreakdown.map((_, i) => <Cell key={i} fill={OPEX_COLORS[i % OPEX_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => [formatCurrency(Number(v ?? 0)), '']} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="section-title">Revenue vs OpEx ($/yr)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueVsOpex} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [formatCurrency(Number(v ?? 0)), '']} />
              <Bar dataKey="revenue" name="Revenue" fill="#16a34a" radius={[4,4,0,0]} />
              <Bar dataKey="opex" name="OpEx" fill="#f97316" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
