const prisma = require('../prisma')

// checks if the requesting user has a specific role in the project
// usage: requireProjectRole('admin') or requireProjectRole('member')
function requireProjectRole(role) {
  return async (req, res, next) => {
    const projectId = parseInt(req.params.id || req.params.projectId)
    const userId = req.user.id

    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId, projectId }
      }
    })

    if (!membership) {
      return res.status(403).json({ error: 'not a member of this project' })
    }

    // admins can do everything members can
    if (role === 'admin' && membership.role !== 'admin') {
      return res.status(403).json({ error: 'only project admins can do this' })
    }

    req.membership = membership
    next()
  }
}

module.exports = { requireProjectRole }
