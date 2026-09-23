/** A single, labelled switch language for optional experience controls. */
export function FlightToggle({label,checked,onChange,disabled=false}:{label:string;checked:boolean;onChange:(checked:boolean)=>void;disabled?:boolean}) {
 return <label className="flight-toggle-row"><span>{label}</span><input type="checkbox" role="switch" aria-label={label} checked={checked} disabled={disabled} onChange={event=>onChange(event.target.checked)}/><span className="flight-toggle-track" aria-hidden="true"/></label>
}
