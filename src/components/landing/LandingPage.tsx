import { LandingHero } from './LandingHero'
import { LandingAbout } from './LandingAbout'
import { LandingOfferings } from './LandingOfferings'
import { LandingEnterprises } from './LandingEnterprises'
import { LandingFAQ } from './LandingFAQ'
import { LandingCTA } from './LandingCTA'
import { LandingFooter } from './LandingFooter'

export function LandingPage() {
  return (
    <div className="landing-layout">
      <LandingHero />
      <LandingAbout />
      <LandingOfferings />
      <LandingEnterprises />
      <LandingFAQ />
      <LandingCTA />
      <LandingFooter />
    </div>
  )
}
