export const idlFactory = ({ IDL }) => {
  return IDL.Service({ 'getHead' : IDL.Func([], [IDL.Text], ['query']) });
};
export const init = ({ IDL }) => { return []; };
