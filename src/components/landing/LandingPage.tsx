import { LandingHero } from './LandingHero'
import { LandingAbout } from './LandingAbout'
import { LandingOfferings } from './LandingOfferings'
import { LandingEnterprises } from './LandingEnterprises'
import { LandingCTA } from './LandingCTA'
import { LandingFooter } from './LandingFooter'
import { ScrollProgressBar } from './ScrollProgressBar'

export function LandingPage() {
  return (
    <div className="landing-layout">
      <ScrollProgressBar />
      <LandingHero />
      <LandingAbout />
      <LandingOfferings />
      <LandingEnterprises />
      <LandingCTA />
      <LandingFooter />
    </div>
  )
}

