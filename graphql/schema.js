const {buildSchema}=require('graphql');

// module.exports=buildSchema(`
//     type TestData{
//         text:String!
//         views:Int!

//     }
//     type RootQuery{
//         hello:TestData
//     }
    
//     schema{
//         query:RootQuery
//     }

// `)

module.exports=buildSchema(`
    type Post{
        _id:ID!
        title:String!
        content:String!
        imageUrl:String!
        creator:User!
        createdAt:String!
        updatedAt:String!
    }
    type User{
        _id:ID!
        name:String!
        email:String!
        password:String
        status:String!
        posts:[Post!]!
    }
    type AuthData{
        userId:String!
        token:String!
    }
    input UserInputData{
        email:String!
        name:String!
        password:String!
    }
    type RootMutation{
        createUser(userInput:UserInputData):User 
    }
    type RootQuery{
        login(email:String!, password:String!):AuthData
    }
    schema {
        mutation:RootMutation
        query:RootQuery
    }
`)