import { Link } from 'react-router-dom'

export function LandingOfferings() {
  const offerings = [
    {
      num: '01',
      title: 'Visual Dashboard',
      tag: 'Real-Time KPIs',
      desc: 'Real-time operational command center with live division metrics, plucking trends, weather index, and plantation KPIs at a single glance.',
      link: '/map',
    },
    {
      num: '02',
      title: 'Plot Mapping',
      tag: 'GIS & Boundaries',
      desc: 'Sub-meter vector GIS boundaries for all 218 field plots, division zoning, contour topography layers, and interactive parcel inspection.',
      link: '/map?tab=map',
    },
    {
      num: '03',
      title: 'Task Management',
      tag: 'Field Dispatch',
      desc: 'Dispatch and schedule tea plucking, fertilizer spraying, weeding, and pruning work orders with live Kanban progress tracking.',
      link: '/map?tab=tasks',
    },
    {
      num: '04',
      title: 'Employee Management',
      tag: 'Workforce & Muster',
      desc: 'Digital daily muster roll, gang supervisor assignments, field crew deployment, and real-time worker directory without paper books.',
      link: '/map?tab=workforce',
    },
    {
      num: '05',
      title: 'Salary Management',
      tag: 'Payroll & Wages',
      desc: 'Automated wage calculation with base pay, piece-rate green leaf incentives, overtime hours, and field allowances generated transparently.',
      link: '/map?tab=daily_salary',
    },
    {
      num: '06',
      title: 'Harvest Management',
      tag: 'Yield Logistics',
      desc: 'Digital scale weigh-in recording, fine leaf grade compliance, daily yield summaries per block, and verified dispatch slips for factory processing.',
      link: '/map?tab=harvest',
    },
    {
      num: '07',
      title: 'Inventory Management',
      tag: 'Store & Agrochemicals',
      desc: 'Track agricultural fertilizer reserves, foliar chemicals, plucking baskets, estate equipment maintenance, and division store stock balances.',
      link: '/map?tab=inventory',
    },
  ]

  return (
    <section id="offerings" className="section section--offerings">
      <div className="section-container">
        {/* Eyebrow & Title */}
        <div className="section-header-center">
          <span className="section-eyebrow">Enterprise Platform</span>
          <h2 className="section-title section-title--center">
            What We Offer
          </h2>
          <p className="offerings-header-desc">
            A comprehensive digital plantation ecosystem built for modern tea estates — connecting spatial GIS mapping, field operations, workforce management, and harvest logistics.
          </p>
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
              Everything you need to manage your land, keep soil healthy, and track your daily tea harvest
              using simple digital tools.
            </p>

            <div className="offerings-badges-grid">
              <div className="offering-badge">
                <div>
                  <strong>25+ Years</strong>
                  <small>Estate Experience</small>
                </div>
              </div>
              <div className="offering-badge">
                <div>
                  <strong>100%</strong>
                  <small>Pure Ceylon Tea</small>
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

        {/* 7-Card Clean Offerings Grid */}
        <div className="offerings-grid">
          {offerings.map((item) => (
            <Link
              key={item.num}
              to={item.link}
              className="offering-card"
            >
              <div className="offering-card__top">
                <span className="offering-card__num">{item.num}</span>
                <span className="offering-card__tag">{item.tag}</span>
              </div>

              <div className="offering-card__body">
                <h3 className="offering-card__title">{item.title}</h3>
                <p className="offering-card__desc">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}


