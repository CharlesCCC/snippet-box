import { TagModel, SnippetModel, Snippet_TagModel, UserModel, UserSavedSnippetModel, SnippetLikeModel } from '../models';

export const associateModels = async () => {
  TagModel.belongsToMany(SnippetModel, {
    through: Snippet_TagModel,
    foreignKey: 'tag_id',
    as: 'snippets'
  });

  SnippetModel.belongsToMany(TagModel, {
    through: Snippet_TagModel,
    foreignKey: 'snippet_id',
    as: 'tags'
  });

  // User saved snippets associations
  UserModel.belongsToMany(SnippetModel, {
    through: UserSavedSnippetModel,
    foreignKey: 'user_id',
    as: 'savedSnippets'
  });

  SnippetModel.belongsToMany(UserModel, {
    through: UserSavedSnippetModel,
    foreignKey: 'snippet_id',
    as: 'savedByUsers'
  });

  // User liked snippets associations
  UserModel.belongsToMany(SnippetModel, {
    through: SnippetLikeModel,
    foreignKey: 'user_id',
    as: 'likedSnippets'
  });

  SnippetModel.belongsToMany(UserModel, {
    through: SnippetLikeModel,
    foreignKey: 'snippet_id',
    as: 'likedByUsers'
  });
};
