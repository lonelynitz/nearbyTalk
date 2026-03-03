import { RADIUS_OPTIONS } from '../../utils/constants';

export default function RadiusSelector({ value, onChange }) {
  return (
    <div className="radius-selector">
      <label>Search Radius</label>
      <select value={value} onChange={e => onChange(Number(e.target.value))}>
        {RADIUS_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
