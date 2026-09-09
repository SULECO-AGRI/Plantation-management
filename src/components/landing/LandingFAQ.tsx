import { useState } from 'react'
import { HelpCircle, Minus, Plus, Sprout } from 'lucide-react'

export function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      q: 'How does the GIS field inspection mode assist plantation managers?',
      a: 'It enables managers to click on any of the 218 field polygons across the estate to instantly inspect acreage in hectares and acres, parent division attribution, geometric perimeter, and exact geographic center coordinates in real time.',
    },
    {
      q: 'What are the 5 divisions comprising Weddamulle Plantation?',
      a: 'The estate is partitioned into Ramboda, Wewandon, Lilliesland, Camnethan, and Weddamulla divisions, each encompassing distinct micro-climates, soil conditions, and elevation ranges from 4,000ft to over 6,000ft.',
    },
    {
      q: 'How is spatial land use categorized between tea, vegetation, grass, and infrastructure?',
      a: 'Each division maintains a granular breakdown of Tea Cultivation Area (Tea_ac), Natural Vegetation (Veg_ac), Grass Buffer Belts (Grass_ac), High-Canopy Forests (HighVeg_ac), and Infrastructure (Dev_ac) to guarantee ecological sustainability.',
    },
    {
      q: 'How does high-resolution orthophoto imagery integrate with vector layers?',
      a: 'VisiGeo high-altitude orthophoto RGB tile sets are dynamically loaded beneath vector polygons, allowing managers to visually inspect canopy density, road networks, and stream corridors in tandem with vector boundaries.',
    },
    {
      q: 'How do I switch between Division Mode and Field Mode on the interactive map?',
      a: 'The map top bar features an instant segmented mode switch: Field Mode focuses clicks on individual field plots, while Division Mode highlights macro division boundaries and total estate percentage allocations.',
    },
    {
      q: 'Can I search for specific field numbers, cultivar blocks, or divisions?',
      a: 'Yes, the map includes an instant search bar with live auto-complete. Searching for a field number or division name zooms directly to the polygon, highlights its geometry, and opens the inspector panel.',
    },
  ]

  const toggle = (idx: number) => {
    setOpenIndex((curr) => (curr === idx ? null : idx))
  }

  return (
    <section id="faq" className="section section--faq">
      <div className="section-container section-container--narrow">
        <div className="section-header-center">

          <h2 className="section-title section-title--center">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="faq-accordion">
          {faqs.map((faq, idx) => {

            const isOpen = openIndex === idx
            return (
              <div
                key={faq.q}
                className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}
              >
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-question__text">{faq.q}</span>
                  <span className="faq-question__icon">
                    {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                  </span>
                </button>

                {isOpen && (
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
