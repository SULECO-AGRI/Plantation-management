import { ChartNoAxesColumnIncreasing, Layers3, Map } from 'lucide-react'

const valueCards = [
  {
    icon: Map,
    number: '01',
    title: 'Estate monitoring',
    body: 'See the plantation as one spatial workspace instead of disconnected files and static maps.',
  },
  {
    icon: Layers3,
    number: '02',
    title: 'Field boundaries',
    body: 'Inspect every uploaded division and field polygon with clear layer controls and source-native attributes.',
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    number: '03',
    title: 'Crop division tracking',
    body: 'Review estate acreage breakdowns, field IDs, geometry metrics, and any custom metadata carried by the GIS files.',
  },
]

export function LandingValues() {
  return (
    <section className="value-section">
      <div className="section-intro">
        <span className="eyebrow">Focused by design</span>
        <h2>Plantation GIS without urban platform complexity.</h2>
        <p>A deliberately compact experience — just the estate, its divisions, its fields, and their source GIS attributes.</p>
      </div>

      <div className="value-grid">
        {valueCards.map(({ icon: Icon, number, title, body }) => (
          <article key={title}>
            <div className="value-card-top">
              <span><Icon size={20} /></span>
              <small>{number}</small>
            </div>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
