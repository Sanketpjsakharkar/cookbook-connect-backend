import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Recipe } from '../../recipes/entities/recipe.entity';
import { Comment } from '../../social/entities/comment.entity';
import { Rating } from '../../social/entities/rating.entity';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
    RECIPE_CREATED = 'RECIPE_CREATED',
    COMMENT_CREATED = 'COMMENT_CREATED',
    RATING_CREATED = 'RATING_CREATED',
    USER_FOLLOWED = 'USER_FOLLOWED',
}

@ObjectType()
export class Notification {
    @Field(() => ID)
    id: string;

    @Field(() => NotificationType)
    type: NotificationType;

    @Field()
    message: string;

    @Field(() => User)
    actor: User; // The user who performed the action

    @Field(() => User, { nullable: true })
    recipient?: User; // The user who receives the notification

    @Field(() => Recipe, { nullable: true })
    recipe?: Recipe;

    @Field(() => Comment, { nullable: true })
    comment?: Comment;

    @Field(() => Rating, { nullable: true })
    rating?: Rating;

    @Field()
    isRead: boolean;

    @Field()
    createdAt: Date;
}

@ObjectType()
export class ActivityFeedItem {
    @Field(() => ID)
    id: string;

    @Field(() => NotificationType)
    type: NotificationType;

    @Field()
    message: string;

    @Field(() => User)
    actor: User;

    @Field(() => Recipe, { nullable: true })
    recipe?: Recipe;

    @Field(() => Comment, { nullable: true })
    comment?: Comment;

    @Field(() => Rating, { nullable: true })
    rating?: Rating;

    @Field()
    createdAt: Date;
}
