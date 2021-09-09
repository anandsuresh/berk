export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'getHead' : IDL.Func([], [IDL.Text], ['query']),
    'getInfoPacks' : IDL.Func([], [IDL.Text], ['query']),
    'getObject' : IDL.Func([IDL.Text], [IDL.Opt(IDL.Vec(IDL.Nat8))], ['query']),
    'getRefs' : IDL.Func([], [IDL.Text], ['query']),
    'lock' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'moveObject' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'putObject' : IDL.Func([IDL.Text, IDL.Vec(IDL.Nat8)], [], []),
    'putRef' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'unlock' : IDL.Func([IDL.Text], [IDL.Bool], []),
  });
};
export const init = ({ IDL }) => { return []; };
