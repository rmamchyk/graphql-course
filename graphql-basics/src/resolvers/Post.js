const Post = {
  author(parent, args, { db }, info) {
    return db.users.find(user => user.id === parent.author)
  },
  comments(parent, args, { db }, info) {
    return db.comments.filter(cm => cm.post === parent.id)
  }
}

export default Post;