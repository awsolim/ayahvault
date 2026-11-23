export function SettingToggle({ label, options, on, toggle }: {
  label: string;
  options: [string, string];
  on: boolean;
  toggle: () => void;
}) {
  return (
    <button type="button" className="memo-setting-toggle" aria-label={label} aria-description={options[Number(on)]} aria-pressed={on} onClick={toggle}>
      <span className="memo-setting-label">{label}</span>
      <span className="setting-segments" aria-hidden="true">
        {options.map((option, index) => (
          <span key={option} className={index === Number(on) ? "active-setting" : undefined}>{option}</span>
        ))}
      </span>
    </button>
  );
}
