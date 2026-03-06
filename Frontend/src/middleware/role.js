export default function ({ store, redirect, route }) {
    const userRole = store.state.auth.user.role
    const requiredRole = route.meta.role

    if (requiredRole && userRole !== requiredRole) {
        return redirect('/unauthorized')
    }
}
