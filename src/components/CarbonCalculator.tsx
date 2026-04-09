import type { FeedstockParams, PyrolysisParams, BiocharResults } from '../types';
import {
  FEEDSTOCK_DEFAULTS,
  PROCESS_EMISSION_FACTORS,
  HEAT_SOURCE_EMISSION_FACTORS,
  formatNum,
} from '../utils/calculations';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';

interface Props {
  feedstock: FeedstockParams;
  pyrolysis: PyrolysisParams;
  results: BiocharResults;
  onFeedstockChange: (p: FeedstockParams) => void;
  onPyrolysisChange: (p: PyrolysisParams) => void;
}

const systemTypes = Object.keys(PROCESS_EMISSION_FACTORS);
const heatSources = Object.keys(HEAT_SOURCE_EMISSION_FACTORS);

function InputRow({
  label,
  tooltip,
  children,
}: {
  label: string;
  tooltip?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {tooltip && <p className="tooltip-box">{tooltip}</p>}
    </div>
  );
}

export default function CarbonCalculator({
  feedstock,
  pyrolysis,
  results,
  onFeedstockChange,
  onPyrolysisChange,
}: Props) {
  function updateFeedstock<K extends keyof FeedstockParams>(key: K, val: FeedstockParams[K]) {
    const updated = { ...feedstock, [key]: val };
    // Update defaults when type changes
    if (key === 'feedstockType') {
      const d = FEEDSTOCK_DEFAULTS[val as string];
      if (d) {
        updated.carbonContent = d.carbon;
        updated.ashContent = d.ash;
      }
    }
    onFeedstockChange(updated);
  }

  function updatePyrolysis<K extends keyof PyrolysisParams>(key: K, val: PyrolysisParams[K]) {
    onPyrolysisChange({ ...pyrolysis, [key]: val });
  }

  const carbonFlowData = [
    { name: 'Feedstock C', value: feedstock.quantity * (feedstock.carbonContent / 100), fill: '#86efac' },
    { name: 'Biochar C', value: results.carbonInBiochar, fill: '#16a34a' },
    { name: 'Stable C', value: results.permanentCarbonSeq, fill: '#15803d' },
    { name: 'Gross CO₂e', value: results.co2eSeq, fill: '#4ade80' },
    { name: 'Process Emissions', value: results.processEmissions, fill: '#f87171' },
    { name: 'Net Credits', value: results.netCarbonCredits, fill: '#166534' },
  ];

  const radarData = [
    { metric: 'Yield', value: Math.min((results.biocharYieldPct / 40) * 100, 100) },
    { metric: 'C Content', value: Math.min((results.carbonInBiochar / (feedstock.quantity * 0.5)) * 100, 100) },
    { metric: 'Stability', value: results.biocharStability },
    { metric: 'Net Credits', value: Math.min((results.netCarbonCredits / (feedstock.quantity * 2)) * 100, 100) },
    { metric: 'Efficiency', value: Math.max(100 - (results.processEmissions / results.co2eSeq) * 100, 0) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feedstock Panel */}
        <div className="card">
          <h2 className="section-title">🌾 Feedstock Parameters</h2>

          <InputRow label="Feedstock Type" tooltip="Select the biomass feedstock. Default carbon/ash values will auto-populate.">
            <select
              className="input-field"
              value={feedstock.feedstockType}
              onChange={(e) => updateFeedstock('feedstockType', e.target.value)}
            >
              {Object.keys(FEEDSTOCK_DEFAULTS).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </InputRow>

          <InputRow
            label={`Feedstock Quantity: ${formatNum(feedstock.quantity, 0)} dry t/yr`}
            tooltip="Annual dry weight of feedstock input to the pyrolysis system"
          >
            <input
              type="range"
              className="w-full accent-green-600"
              min={100}
              max={50000}
              step={100}
              value={feedstock.quantity}
              onChange={(e) => updateFeedstock('quantity', Number(e.target.value))}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>100 t</span><span>50,000 t</span>
            </div>
          </InputRow>

          <InputRow
            label={`Moisture Content: ${feedstock.moistureContent}% (wet basis)`}
            tooltip="Moisture content of as-received feedstock. Higher moisture reduces effective dry yield."
          >
            <input
              type="range"
              className="w-full accent-green-600"
              min={5}
              max={70}
              step={1}
              value={feedstock.moistureContent}
              onChange={(e) => updateFeedstock('moistureContent', Number(e.target.value))}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>5%</span><span>70%</span>
            </div>
          </InputRow>

          <InputRow
            label={`Carbon Content: ${feedstock.carbonContent}% dry basis`}
            tooltip="Total carbon content of dry feedstock. Typical range: 38–52% for woody biomass."
          >
            <input
              type="range"
              className="w-full accent-green-600"
              min={30}
              max={60}
              step={0.5}
              value={feedstock.carbonContent}
              onChange={(e) => updateFeedstock('carbonContent', Number(e.target.value))}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>30%</span><span>60%</span>
            </div>
          </InputRow>

          <InputRow
            label={`Ash Content: ${feedstock.ashContent}% dry basis`}
            tooltip="Inorganic ash content. Higher ash means less organic matter available for conversion."
          >
            <input
              type="range"
              className="w-full accent-green-600"
              min={0.5}
              max={30}
              step={0.5}
              value={feedstock.ashContent}
              onChange={(e) => updateFeedstock('ashContent', Number(e.target.value))}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0.5%</span><span>30%</span>
            </div>
          </InputRow>
        </div>

        {/* Pyrolysis Panel */}
        <div className="card">
          <h2 className="section-title">🔥 Pyrolysis Parameters</h2>

          <InputRow label="System Type" tooltip="Pyrolysis technology affects yield, emission factors and energy balance.">
            <select
              className="input-field"
              value={pyrolysis.systemType}
              onChange={(e) => updatePyrolysis('systemType', e.target.value)}
            >
              {systemTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
          </InputRow>

          <InputRow label="Heat Source" tooltip="Energy source for the process affects Scope 1/2 emissions.">
            <select
              className="input-field"
              value={pyrolysis.heatSource}
              onChange={(e) => updatePyrolysis('heatSource', e.target.value)}
            >
              {heatSources.map((t) => <option key={t}>{t}</option>)}
            </select>
          </InputRow>

          <InputRow
            label={`Pyrolysis Temperature: ${pyrolysis.temperature}°C`}
            tooltip="Higher temperatures increase carbon content and stability but reduce yield."
          >
            <input
              type="range"
              className="w-full accent-green-600"
              min={300}
              max={900}
              step={10}
              value={pyrolysis.temperature}
              onChange={(e) => updatePyrolysis('temperature', Number(e.target.value))}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>300°C</span><span>900°C</span>
            </div>
          </InputRow>

          <InputRow
            label={`Residence Time: ${pyrolysis.residenceTime} min`}
            tooltip="Time biomass spends at peak temperature. Longer residence → higher fixed carbon."
          >
            <input
              type="range"
              className="w-full accent-green-600"
              min={5}
              max={240}
              step={5}
              value={pyrolysis.residenceTime}
              onChange={(e) => updatePyrolysis('residenceTime', Number(e.target.value))}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>5 min</span><span>240 min</span>
            </div>
          </InputRow>

          <InputRow
            label={`Energy Consumption: ${pyrolysis.energyConsumption} kWh/t dry feed`}
            tooltip="External energy input (excluding energy from syngas). Typical slow pyrolysis: 200-400 kWh/t."
          >
            <input
              type="range"
              className="w-full accent-green-600"
              min={0}
              max={800}
              step={10}
              value={pyrolysis.energyConsumption}
              onChange={(e) => updatePyrolysis('energyConsumption', Number(e.target.value))}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0</span><span>800 kWh/t</span>
            </div>
          </InputRow>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Biochar Yield', value: `${formatNum(results.biocharYield, 1)} t/yr`, sub: `(${formatNum(results.biocharYieldPct, 1)}% of dry feed)`, color: 'text-green-700' },
          { label: 'Carbon in Biochar', value: `${formatNum(results.carbonInBiochar, 1)} t C/yr`, sub: '', color: 'text-green-700' },
          { label: 'Gross CO₂e Sequestered', value: `${formatNum(results.co2eSeq, 1)} t CO₂e/yr`, sub: `(${formatNum(results.biocharStability, 1)}% stable)`, color: 'text-emerald-700' },
          { label: 'Net Carbon Credits', value: `${formatNum(results.netCarbonCredits, 1)} t CO₂e/yr`, sub: `(−${formatNum(results.processEmissions, 1)} t process)`, color: 'text-green-900 font-bold' },
        ].map((m) => (
          <div key={m.label} className="metric-card">
            <div className={`metric-value ${m.color}`}>{m.value}</div>
            <div className="metric-label">{m.label}</div>
            {m.sub && <div className="text-xs text-gray-400 mt-0.5">{m.sub}</div>}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="section-title">Carbon Flow (t C or CO₂e / yr)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={carbonFlowData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${formatNum(Number(v ?? 0), 1)} t`, '']} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {carbonFlowData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="section-title">Project Quality Radar</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#d1fae5" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <Radar
                name="Score"
                dataKey="value"
                stroke="#16a34a"
                fill="#16a34a"
                fillOpacity={0.35}
              />
              <Tooltip formatter={(v) => [`${formatNum(Number(v ?? 0), 1)}%`, 'Score']} />
            </RadarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 text-center mt-2">
            Normalised 0–100 score based on project parameters
          </p>
        </div>
      </div>

      {/* Methodology Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>📖 Methodology:</strong> Carbon sequestration is calculated using feedstock carbon
        content, pyrolysis yield factors (temperature-adjusted), and H:C<sub>org</sub>-based
        stability corrections following{' '}
        <em>IBI Biochar Standards (2015)</em> and <em>VERRA VM0044 v1.1</em>. Process emissions
        include direct combustion and energy-related emissions. Net credits = gross CO₂e −
        process emissions.
      </div>
    </div>
  );
}
