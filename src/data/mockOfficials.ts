export type EstateDivision = 'Weddamulla' | 'Ramboda' | 'Camnethan' | 'Lilliesland' | 'Wewandon'

export type Official = {
  id: string
  name: string
  role: 'division_manager' | 'field_officer'
  roleTitle: string
  division: EstateDivision
  phone: string
  email: string
  avatar?: string
  assignedField?: string
  defaultGang?: string
}

export const MOCK_OFFICIALS: Official[] = [
  // --- Division Managers (One per Division) ---
  {
    id: 'user-manager-02',
    name: 'D. Wickramasinghe',
    role: 'division_manager',
    roleTitle: 'Division Manager (Weddamulla)',
    division: 'Weddamulla',
    phone: '+94 76 550 4932',
    email: 'd.wickramasinghe@weddamulla-tea.lk',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'mgr-ramboda',
    name: 'R. Samarasinghe',
    role: 'division_manager',
    roleTitle: 'Division Manager (Ramboda)',
    division: 'Ramboda',
    phone: '+94 76 430 8821',
    email: 'r.samarasinghe@weddamulla-tea.lk',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'mgr-camnethan',
    name: 'N. P. Jayawardena',
    role: 'division_manager',
    roleTitle: 'Division Manager (Camnethan)',
    division: 'Camnethan',
    phone: '+94 76 892 1104',
    email: 'n.jayawardena@weddamulla-tea.lk',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'mgr-lilliesland',
    name: 'H. M. Alahakoon',
    role: 'division_manager',
    roleTitle: 'Division Manager (Lilliesland)',
    division: 'Lilliesland',
    phone: '+94 76 221 9054',
    email: 'h.alahakoon@weddamulla-tea.lk',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'mgr-wewandon',
    name: 'C. K. Dissanayake',
    role: 'division_manager',
    roleTitle: 'Division Manager (Wewandon)',
    division: 'Wewandon',
    phone: '+94 76 778 4432',
    email: 'c.dissanayake@weddamulla-tea.lk',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  },

  // --- Field Officers (Per Division) ---
  // Weddamulla
  {
    id: 'user-officer-03',
    name: 'K. Bandara',
    role: 'field_officer',
    roleTitle: 'Field Officer (Block 4B)',
    division: 'Weddamulla',
    assignedField: 'Block 4B',
    defaultGang: 'Weddamulla Gang #1',
    phone: '+94 71 845 2211',
    email: 'k.bandara@weddamulla-tea.lk',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'fo-wed-raman',
    name: 'S. Raman',
    role: 'field_officer',
    roleTitle: 'Senior Field Officer (Block 2A & 3C)',
    division: 'Weddamulla',
    assignedField: 'Block 3C',
    defaultGang: 'Weddamulla Sundry Ops',
    phone: '+94 77 341 8970',
    email: 's.raman@weddamulla-field.lk',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },

  // Ramboda
  {
    id: 'fo-ramboda',
    name: 'T. Krishnan',
    role: 'field_officer',
    roleTitle: 'Field Officer (Block 11A & 9C)',
    division: 'Ramboda',
    assignedField: 'Block 11A',
    defaultGang: 'Ramboda Gang #3',
    phone: '+94 77 650 1199',
    email: 't.krishnan@weddamulla-tea.lk',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  },

  // Camnethan
  {
    id: 'fo-camnethan',
    name: 'K. Rajaratnam',
    role: 'field_officer',
    roleTitle: 'Field Officer (Block 7B & 5A)',
    division: 'Camnethan',
    assignedField: 'Block 7B',
    defaultGang: 'Camnethan Gang #2',
    phone: '+94 77 412 8871',
    email: 'k.rajaratnam@weddamulla-tea.lk',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  },

  // Lilliesland
  {
    id: 'fo-lilliesland',
    name: 'V. Murugan',
    role: 'field_officer',
    roleTitle: 'Field Officer (Block 3A)',
    division: 'Lilliesland',
    assignedField: 'Block 3A',
    defaultGang: 'Lilliesland Gang #1',
    phone: '+94 77 789 2314',
    email: 'v.murugan@weddamulla-tea.lk',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },

  // Wewandon
  {
    id: 'fo-wewandon',
    name: 'P. Balasubramaniam',
    role: 'field_officer',
    roleTitle: 'Field Officer (Block 1A)',
    division: 'Wewandon',
    assignedField: 'Block 1A',
    defaultGang: 'Wewandon Gang #1',
    phone: '+94 77 901 3452',
    email: 'p.bala@weddamulla-tea.lk',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
]

export const getDivisionManagers = (): Official[] => {
  return MOCK_OFFICIALS.filter((o) => o.role === 'division_manager')
}

export const getDivisionManagerForDivision = (division: EstateDivision): Official | undefined => {
  return MOCK_OFFICIALS.find((o) => o.role === 'division_manager' && o.division === division)
}

export const getFieldOfficers = (division?: EstateDivision): Official[] => {
  if (!division || division === ('All Divisions' as any)) {
    return MOCK_OFFICIALS.filter((o) => o.role === 'field_officer')
  }
  return MOCK_OFFICIALS.filter((o) => o.role === 'field_officer' && o.division === division)
}

export const findOfficialById = (id: string): Official | undefined => {
  return MOCK_OFFICIALS.find((o) => o.id === id)
}
