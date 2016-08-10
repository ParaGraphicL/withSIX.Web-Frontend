export interface _Indexer<TModel> {
  [name: string]: TModel;
}

export interface IHandleCommentsScope<TCommentType> {
  comments: TCommentType[];
  addComment: (newComment) => void;
  deleteComment: (comment) => void;
  saveComment: (comment) => void;
  reportComment: (comment) => void;
  commentLikeStates: {};
  likeComment: (comment) => void;
  unlikeComment: (comment) => void;
}

export interface IModel<TModel> {
  model: TModel;
}



export interface ICQWM<T> {
  //execute: any;
  $ModelType: T;
}

export interface ICreateComment<TComment> {
  contentId: string;
  message: string;
  replyTo?: TComment;
  replyToId?: number;
}

export interface ITagKey {
  text: string;
  key: string;
}

export interface IMenuItem {
  header: string;
  segment: string;
  mainSegment?: string;
  fullSegment?: string;
  cls?: string;
  icon?: string;
  isRight?: boolean;
  isDefault?: boolean;
  url?: string;
}

export interface ICommentsScope<TComment> {
  comments: Array<TComment>;
  newComment: INewComment<TComment>;
  addComment: (newComment: INewComment<TComment>) => void;
  deleteComment: (comment: TComment) => any;
  saveComment: (comment: TComment) => void;
  reportComment: (comment: TComment) => void;
}

export interface INewComment<TComment> {
  message: string;
  replyTo: TComment;
}
