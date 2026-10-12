import { Link } from 'react-router-dom'

export function LandingVision() {
  const modules = [
    {
      id: 'dashboard',
      num: '01',
      title: 'Visual Dashboard',
      desc: 'Real-time operational command center with live division metrics, plucking trends, weather alerts, and plantation KPIs at a single glance.',
    },
    {
      id: 'mapping',
      num: '02',
      title: 'Plot Mapping',
      desc: 'Sub-meter vector polygon boundaries, division zoning, contour topography layers, and interactive parcel inspection for all agricultural fields.',
    },
    {
      id: 'tasks',
      num: '03',
      title: 'Task Management',
      desc: 'Dispatch and schedule tea plucking, fertilizer spraying, weeding, and pruning work orders with live progress tracking and overdue alerts.',
    },
    {
      id: 'employees',
      num: '04',
      title: 'Employee Management',
      desc: 'Digital daily muster roll, gang supervisor assignments, field crew deployment, and harvester attendance records without physical paper books.',
    },
    {
      id: 'salary',
      num: '05',
      title: 'Salary Management',
      desc: 'Automated wage calculation with base pay, piece-rate green leaf incentives, overtime hours, and field allowances generated transparently.',
    },
    {
      id: 'harvest',
      num: '06',
      title: 'Harvest Management',
      desc: 'Digital scale weigh-in recording, fine leaf grade compliance, daily yield summaries per block, and verified dispatch slips for factory processing.',
    },
    {
      id: 'inventory',
      num: '07',
      title: 'Inventory Management',
      desc: 'Track agricultural fertilizer reserves, foliar chemicals, plucking baskets, equipment maintenance, and division store stock balances.',
    },
  ]

  return (
    <section id="vision" className="section section--vision">
      <div className="section-container">
        {/* Section Header: Our Vision */}
        <div className="modules-header">
          <div>
            <h2 className="modules-title">
              Our Vision
            </h2>
          </div>
          <p className="modules-lead">
            A unified digital ecosystem for modern plantations — connecting visual analytics, GIS plot mapping, field operations, workforce, and harvest logistics.
          </p>
        </div>

        {/* 7 Modules Simple UI Grid (No Icons) */}
        <div className="modules-grid">
          {modules.map((m) => (
            <Link key={m.id} to="/map" className="module-card">
              <div className="module-card__header">
                <span className="module-card__num">{m.num}</span>
                <span className="module-card__arrow">&rarr;</span>
              </div>
              <h3 className="module-card__title">{m.title}</h3>
              <p className="module-card__desc">{m.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
