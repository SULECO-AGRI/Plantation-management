import { ArrowUpRight, CheckCircle2, MapPin, ShieldCheck, Sprout } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LandingOfferings() {
  const offerings = [
    {
      num: '1',
      title: 'GIS Spatial Mapping & Boundary Surveying',
      desc: 'Sub-meter polygon demarcation across 218 field plots with elevation contour tracking, land-use zoning, and real-time inspector overlays.',
    },
    {
      num: '2',
      title: 'Fertilizers & Soil Nutrient Management',
      desc: 'Precision micro-nutrient dosage schedules formulated for high-altitude acidic soils and balanced organic biomass enrichment.',
    },
    {
      num: '3',
      title: 'Yield Analytics & Integrated Crop Protection',
      desc: 'Division-by-division leaf intake monitoring, weather index correlation, and biological canopy disease prevention.',
    },
  ]

  return (
    <section id="offerings" className="section section--offerings">
      <div className="section-container">
        {/* Eyebrow & Title */}
        <div className="section-header-center">
          <h2 className="section-title section-title--center">
            Agricultural Offerings
          </h2>
        </div>

        {/* Top 3-Col Bento Row */}
        <div className="offerings-top-grid">
          {/* Left image */}
          <div className="offerings-img-card">
            <img
              src="/images/feature_gis.jpg"
              alt="Agronomist surveying tea fields using GIS digital tablet"
              loading="lazy"
            />
          </div>

          {/* Center text & badges */}
          <div className="offerings-center-card">
            <p>
              Discover a wide range of high-quality tools and precision spatial solutions designed
              to optimize your plantation yield, soil health, and workforce allocation across high-altitude
              Ceylon tea terrain.
            </p>

            <div className="offerings-badges-grid">
              <div className="offering-badge">
                <ShieldCheck size={18} />
                <div>
                  <strong>25+ Years</strong>
                  <small>Estate Heritage</small>
                </div>
              </div>
              <div className="offering-badge">
                <CheckCircle2 size={18} />
                <div>
                  <strong>100%</strong>
                  <small>Export Quality</small>
                </div>
              </div>
            </div>
          </div>

          {/* Right image */}
          <div className="offerings-img-card">
            <img
              src="/images/feature_harvest.jpg"
              alt="Freshly plucked green tea leaves in wicker basket"
              loading="lazy"
            />
          </div>
        </div>

        {/* Bottom 2-Col Row */}
        <div className="offerings-bottom-grid">
          {/* Left Forest Card */}
          <div className="offerings-cta-card">
            <div className="offerings-cta-card__top">
              <div className="icon-pill">
                <Sprout size={18} />
              </div>
              <Link to="/map" className="circle-arrow-link" aria-label="Explore estate products">
                <ArrowUpRight size={18} />
              </Link>
            </div>
            <h3>Explore Our Farm Products</h3>
            <p>
              Premium orthodox single-origin black tea, vegetative soil buffer crops, and certified
              sustainable timber reserves.
            </p>
            <Link to="/map" className="btn btn--white btn--sm">
              <MapPin size={14} />
              <span>Explore Interactive Map</span>
            </Link>
          </div>

          {/* Right Numbered Feature Rows */}
          <div className="offerings-list">
            {offerings.map((item) => (
              <div key={item.num} className="offering-item">
                <div className="offering-item__num">{item.num}</div>
                <div className="offering-item__content">
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
