export const ROLE_HOME = {
  SuperAdmin: '/dashboard',
  SchoolAdmin: '/school-admin',
  Student: '/student',
}

export const homeFor = (role) => ROLE_HOME[role] || '/login'