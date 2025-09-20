# GraphQL Subscriptions Examples

This document provides example GraphQL subscription queries for testing real-time features in CookBook Connect.

## Authentication

All subscriptions require JWT authentication. Include the authorization header:

```
{
  "authorization": "Bearer YOUR_JWT_TOKEN"
}
```

## Subscription Examples

### 1. User Feed Subscription

Subscribe to your personal activity feed (recipes from followed users, notifications):

```graphql
subscription UserFeed {
  userFeed {
    id
    type
    message
    actor {
      id
      username
      firstName
      lastName
      avatar
    }
    recipe {
      id
      title
      description
      imageUrl
      cuisine
      difficulty
      cookingTime
    }
    comment {
      id
      content
      createdAt
    }
    rating {
      id
      value
      createdAt
    }
    createdAt
  }
}
```

### 2. Recipe Activity Subscription

Subscribe to activity on a specific recipe (comments, ratings):

```graphql
subscription RecipeActivity($recipeId: ID!) {
  recipeActivity(recipeId: $recipeId) {
    id
    type
    message
    actor {
      id
      username
      firstName
      lastName
      avatar
    }
    recipe {
      id
      title
    }
    comment {
      id
      content
      createdAt
    }
    rating {
      id
      value
      createdAt
    }
    createdAt
  }
}
```

**Variables:**
```json
{
  "recipeId": "recipe-uuid-here"
}
```

### 3. Global Activity Subscription

Subscribe to all platform activity:

```graphql
subscription GlobalActivity {
  globalActivity {
    id
    type
    message
    actor {
      id
      username
      firstName
      lastName
      avatar
    }
    recipe {
      id
      title
      description
      cuisine
      difficulty
    }
    createdAt
  }
}
```

### 4. New Recipes from Followed Users

Subscribe specifically to new recipes from users you follow:

```graphql
subscription NewRecipeFromFollowedUsers {
  newRecipeFromFollowedUsers {
    id
    type
    message
    actor {
      id
      username
      firstName
      lastName
      avatar
    }
    recipe {
      id
      title
      description
      imageUrl
      cuisine
      difficulty
      cookingTime
      createdAt
    }
    createdAt
  }
}
```

### 5. New Comments on Recipe

Subscribe to new comments on a specific recipe:

```graphql
subscription NewCommentOnRecipe($recipeId: ID!) {
  newCommentOnRecipe(recipeId: $recipeId) {
    id
    type
    message
    actor {
      id
      username
      firstName
      lastName
      avatar
    }
    recipe {
      id
      title
    }
    comment {
      id
      content
      createdAt
    }
    createdAt
  }
}
```

**Variables:**
```json
{
  "recipeId": "recipe-uuid-here"
}
```

### 6. New Ratings on Recipe

Subscribe to new ratings on a specific recipe:

```graphql
subscription NewRatingOnRecipe($recipeId: ID!) {
  newRatingOnRecipe(recipeId: $recipeId) {
    id
    type
    message
    actor {
      id
      username
      firstName
      lastName
      avatar
    }
    recipe {
      id
      title
    }
    rating {
      id
      value
      createdAt
    }
    createdAt
  }
}
```

**Variables:**
```json
{
  "recipeId": "recipe-uuid-here"
}
```

## Testing with GraphQL Playground

1. Start the development server:
   ```bash
   npm run start:dev
   ```

2. Open GraphQL Playground at `http://localhost:3000/graphql`

3. Set up authentication in the HTTP Headers section:
   ```json
   {
     "authorization": "Bearer YOUR_JWT_TOKEN"
   }
   ```

4. Open multiple tabs to test different subscriptions

5. In another tab, perform mutations (create recipe, add comment, add rating) to trigger real-time updates

## Testing with WebSocket Clients

For WebSocket testing, you can use tools like:
- **wscat**: `wscat -c ws://localhost:3000/graphql -s graphql-ws`
- **Postman**: WebSocket support for GraphQL subscriptions
- **Altair GraphQL Client**: Desktop app with subscription support

## Connection Parameters for WebSocket

When connecting via WebSocket, include authentication in connection parameters:

```json
{
  "authorization": "Bearer YOUR_JWT_TOKEN"
}
```

## Troubleshooting

### Common Issues:

1. **Authentication Errors**: Ensure JWT token is valid and included in connection params
2. **Connection Drops**: Check Redis connectivity and network stability
3. **No Events Received**: Verify you're subscribed to the correct channels and have proper permissions
4. **Performance Issues**: Monitor connection count and Redis memory usage

### Debug Logs:

Enable debug logging by setting environment variable:
```bash
LOG_LEVEL=debug npm run start:dev
```

This will show detailed logs for:
- WebSocket connections/disconnections
- Redis pub/sub messages
- Subscription filter results
- Connection manager statistics
