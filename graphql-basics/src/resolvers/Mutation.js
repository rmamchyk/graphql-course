import uuidv4 from 'uuid/v4'

const Mutation = {
  createUser(parent, args, { db }, info) {
    const emailTaken = db.users.some(user => user.email.toLowerCase() === args.data.email.toLowerCase())
    if (emailTaken) {
      throw new Error('Email taken.')
    }
    const user = {
      id: uuidv4(),
      ...args.data
    }
    db.users.push(user)
    return user
  },
  deleteUser(parent, args, { db }, info) {
    const userIndex = db.users.findIndex(user => user.id === args.id)
    if (userIndex === -1) {
      throw new Error('User not found.')
    }
    const deletedUser = db.users.splice(userIndex, 1)[0]
    // delete all posts created by a given user
    db.posts = db.posts.filter(post => {
      const match = post.author == deletedUser.id
      if (match) {
        db.comments = db.comments.filter(cm => cm.post !== post.id)
      }
      return !match
    })
    // delete all comments created by a given user
    db.comments = db.comments.filter(cm => cm.author !== deletedUser.id)
    return deletedUser
  },
  updateUser(parent, args, { db }, info) {
    const { id, data } = args
    const user = db.users.find(user => user.id === id)
    if (!user) {
      throw new Error('User not found')
    }
    if (typeof data.email === 'string') {
      const emailTaken = db.users.some(user => user.email.toLowerCase() === data.email.toLowerCase())
      if (emailTaken) {
        throw new Error('Email taken')
      }
      user.email = data.email
    }
    if (typeof data.name === 'string') {
      user.name = data.name
    }
    if (typeof data.age !== 'undefined') {
      user.age = data.age
    }
    return user
  },
  createPost(parent, args, { db, pubsub }, info) {
    const userExists = db.users.some(user => user.id === args.data.author)
    if (!userExists) {
      throw new Error('User not found.')
    }
    const post = {
      id: uuidv4(),
      ...args.data
    }
    db.posts.push(post)
    if (post.published) {
      pubsub.publish('post', {
        post: {
          mutation: 'CREATED',
          data: post
        }
      })
    }
    return post
  },
  deletePost(parent, args, { db, pubsub }, info) {
    const postIndex = db.posts.findIndex(post => post.id === args.id)
    if (postIndex === -1) {
      throw new Error('Post not found')
    }
    const deletedPost = db.posts.splice(postIndex, 1)[0]
    db.comments = db.comments.filter(cm => cm.post !== deletedPost.id)
    if (deletedPost.published) {
      pubsub.publish('post', {
        post: {
          mutation: 'DELETED',
          data: deletedPost
        }
      })
    }
    return deletedPost
  },
  updatePost(parent, args, { db, pubsub }, info) {
    const { id, data } = args
    const post = db.posts.find(post => post.id === id)
    const originalPost = { ...post }
    if (!post) {
      throw new Error('Post not found')
    }
    if (typeof data.title === 'string') {
      post.title = data.title
    }
    if (typeof data.body === 'string') {
      post.body = data.body
    }
    if (typeof data.published === 'boolean') {
      post.published = data.published

      if (originalPost.published && !post.published) {
        // deleted
        pubsub.publish('post', {
          post: {
            mutation: 'DELETED',
            data: originalPost
          }
        })
      } else if (!originalPost.published && post.published) {
        // created
        pubsub.publish('post', {
          post: {
            mutation: 'CREATED',
            data: post
          }
        })
      }
    } else if (post.published) {
      // updated
      pubsub.publish('post', {
        post: {
          mutation: 'UPDATED',
          data: post
        }
      })
    }
    return post
  },
  createComment(parent, args, { db, pubsub }, info) {
    const userExists = db.users.some(user => user.id === args.data.author)
    if (!userExists) {
      throw new Error('User not found.')
    }
    const postExists = db.posts.some(post => post.id === args.data.post && post.published)
    if (!postExists) {
      throw new Error('Post not found.')
    }
    const comment = {
      id: uuidv4(),
      ...args.data
    }
    db.comments.push(comment)
    pubsub.publish(`comment ${comment.post}`, { 
      comment: {
        mutation: 'CREATED',
        data: comment
      }
     })
    return comment
  },
  deleteComment(parent, args, { db, pubsub }, info) {
    const commentIndex = db.comments.findIndex(cm => cm.id === args.id)
    if (commentIndex === -1) {
      throw new Error('Comment not found')
    }
    const deletedComment = db.comments.splice(commentIndex, 1)[0]
    pubsub.publish(`comment ${deletedComment.post}`, { 
      comment: {
        mutation: 'DELETED',
        data: deletedComment
      }
     })
    return deletedComment
  },
  updateComment(parent, args, { db, pubsub }, info) {
    const { id, data } = args
    const comment = db.comments.find(cm => cm.id === id)
    if (!comment) {
      throw new Error('Comment not found')
    }
    if (typeof data.text === 'string') {
      comment.text = data.text
    } 
    pubsub.publish(`comment ${comment.post}`, { 
      comment: {
        mutation: 'UPDATED',
        data: comment
      }
     })
    return comment
  }
}

export default Mutation;