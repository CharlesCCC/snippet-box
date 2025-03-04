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
    foreignKey: 'userId',
    as: 'savedSnippets'
  });

  SnippetModel.belongsToMany(UserModel, {
    through: UserSavedSnippetModel,
    foreignKey: 'snippetId',
    as: 'savedByUsers'
  });

  // User liked snippets associations
  UserModel.belongsToMany(SnippetModel, {
    through: SnippetLikeModel,
    foreignKey: 'userId',
    as: 'likedSnippets'
  });

  SnippetModel.belongsToMany(UserModel, {
    through: SnippetLikeModel,
    foreignKey: 'snippetId',
    as: 'likedByUsers'
  });
};
