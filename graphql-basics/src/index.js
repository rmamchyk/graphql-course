import { GraphQLServer } from 'graphql-yoga'
import uuidv4 from 'uuid/v4'

let users = [
  {
    id: '1',
    name: 'Roman',
    email: 'roman@example.com',
    age: 28
  },
  {
    id: '2',
    name: 'Sarah',
    email: 'sarah@example.com'
  },
  {
    id: '3',
    name: 'Mike',
    email: 'mike@example.com'
  }
]

let posts = [
  {
    id: '10',
    title: 'GraphQL 101',
    body: 'This is how to use GraphQL...',
    published: true,
    author: '1'
  },
  {
    id: '11',
    title: 'GraphQL 201',
    body: 'This is an advanced GraphQL post...',
    published: true,
    author: '1'
  },
  {
    id: '12',
    title: 'Programming Music',
    body: '',
    published: false,
    author: '2'
  }
]

let comments = [
  {
    id: '102',
    text: 'This worked well for me. Thanks!',
    author: '3',
    post: '10'
  },
  {
    id: '103',
    text: 'Glad you enjoyed it.',
    author: '1',
    post: '10'
  },
  {
    id: '104',
    text: 'This does not work.',
    author: '2',
    post: '12'
  },
  {
    id: '105',
    text: 'Nevermind. I got it to work.',
    author: '1',
    post: '12'
  }
]

// Resolvers
const resolvers = {
  Query: {
    users(parent, args, ctx, info) {
      if (!args.query) {
        return users
      }
      return users.filter(user => user.name.toLowerCase().includes(args.query.toLowerCase()))
    },
    posts(parent, args, ctx, info) {
      if (!args.query) {
        return posts
      }
      return posts.filter(post => post.title.toLowerCase().includes(args.query.toLowerCase()) || 
        post.body.toLowerCase().includes(args.query.toLowerCase()))
    },
    comments(parent, args, ctx, info) {
      if (!args.query) {
        return comments
      }
      return comments.filter(cm => cm.text.toLowerCase().includes(args.query.toLowerCase()))
    },
    me() {
      return {
        id: '123098',
        name: 'Roman',
        email: 'roman@example.com'
      }
    }
  },
  Mutation: {
    createUser(parent, args, ctx, info) {
      const emailTaken = users.some(user => user.email.toLowerCase() === args.data.email.toLowerCase())
      if (emailTaken) {
        throw new Error('Email taken.')
      }
      const user = {
        id: uuidv4(),
        ...args.data
      }
      users.push(user)
      return user
    },
    deleteUser(parent, args, ctx, info) {
      const userIndex = users.findIndex(user => user.id === args.id)
      if (userIndex === -1) {
        throw new Error('User not found.')
      }
      const deletedUser = users.splice(userIndex, 1)[0]
      // delete all posts created by a given user
      posts = posts.filter(post => {
        const match = post.author == deletedUser.id
        if (match) {
          comments = comments.filter(cm => cm.post !== post.id)
        }
        return !match
      })
      // delete all comments created by a given user
      comments = comments.filter(cm => cm.author !== deletedUser.id)
      return deletedUser
    },
    createPost(parent, args, ctx, info) {
      const userExists = users.some(user => user.id === args.data.author)
      if (!userExists) {
        throw new Error('User not found.')
      }
      const post = {
        id: uuidv4(),
        ...args.data
      }
      posts.push(post)
      return post
    },
    deletePost(parent, args, ctx, info) {
      const postIndex = posts.findIndex(post => post.id === args.id)
      if (postIndex === -1) {
        throw new Error('Post not found')
      }
      const deletedPost = posts.splice(postIndex, 1)[0]
      comments = comments.filter(cm => cm.post !== deletedPost.id)
      return deletedPost
    },
    createComment(parent, args, ctx, info) {
      const userExists = users.some(user => user.id === args.data.author)
      if (!userExists) {
        throw new Error('User not found.')
      }
      const postExists = posts.some(post => post.id === args.data.post && post.published)
      if (!postExists) {
        throw new Error('Post not found.')
      }
      const comment = {
        id: uuidv4(),
        ...args.data
      }
      comments.push(comment)
      return comment
    },
    deleteComment(parent, args, ctx, info) {
      const commentIndex = comments.findIndex(cm => cm.id === args.id)
      if (commentIndex === -1) {
        throw new Error('Comment not found')
      }
      const deletedComment = comments.splice(commentIndex, 1)[0]
      return deletedComment
    }
  },
  Post: {
    author(parent, args, ctx, info) {
      return users.find(user => user.id === parent.author)
    },
    comments(parent, args, ctx, info) {
      return comments.filter(cm => cm.post === parent.id)
    }
  },
  User: {
    posts(parent, args, ctx, info) {
      return posts.filter(post => post.author === parent.id)
    },
    comments(parent, args, ctx, info) {
      return comments.filter(cm => cm.author === parent.id)
    }
  },
  Comment: {
    author(parent, args, ctx, info) {
      return users.find(user => user.id === parent.author)
    },
    post(parent, args, ctx, info) {
      return posts.find(post => post.id === parent.post)
    }
  }
}

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers
})

server.start(() => {
  console.log('The server is running at http://localhost:4000')
})