
% This file is written in Prolog
% It contains rules that the project must respect.
% Check with "yarn constraints" (fix w/ "yarn constraints --fix")
% Yarn Constraints https://yarnpkg.com/features/constraints
% Reference for other constraints:
%   https://github.com/babel/babel/blob/main/constraints.pro
%   https://github.com/yarnpkg/berry/blob/master/constraints.pro

% Enforces the license in all public workspaces while removing it from private workspaces
gen_enforced_field(WorkspaceCwd, 'license', 'MIT') :-
  \+ workspace_field(WorkspaceCwd, 'private', true).
gen_enforced_field(WorkspaceCwd, 'license', null) :-
  workspace_field(WorkspaceCwd, 'private', true).

% This rule will enforce that a workspace MUST depend on the same version of a dependency as the one used by the other workspaces
gen_enforced_dependency(WorkspaceCwd, DependencyIdent, DependencyRange2, DependencyType) :-
  % Iterates over all dependencies from all workspaces
  workspace_has_dependency(WorkspaceCwd, DependencyIdent, DependencyRange, DependencyType),
  % Iterates over similarly-named dependencies from all workspaces (again)
  workspace_has_dependency(OtherWorkspaceCwd, DependencyIdent, DependencyRange2, DependencyType2),
  % Ignore peer dependencies
  DependencyType \= 'peerDependencies',
  DependencyType2 \= 'peerDependencies',
  % A list of exception to same version rule
  \+ member(DependencyIdent, [
    % Allow examples to use different versions of react and
    'react', 'react-dom', 'eslint-config-next', 'next',
    '@types/react', '@types/react-dom',
    % Allow the usage of workspace^ -- there is a better way to do this =)
    '@segment/analytics-next',
    '@segment/analytics-node',
    '@segment/analytics-core',
    '@segment/analytics-consent-wrapper-onetrust',
    '@example/with-next-js',
    '@example/consent-onetrust-next-js',
    '@segment/analytics-consent-tools',
    '@internal/test-helpers',
    '@internal/config',
    '@types/node'
  ]).

% Enforces that a dependency doesn't appear in both `dependencies` and `devDependencies`
gen_enforced_dependency(WorkspaceCwd, DependencyIdent, null, 'devDependencies') :-
  workspace_has_dependency(WorkspaceCwd, DependencyIdent, _, 'devDependencies'),
  workspace_has_dependency(WorkspaceCwd, DependencyIdent, _, 'dependencies').


% Enforces the main and types field to start with ./
gen_enforced_field(WorkspaceCwd, FieldName, ExpectedValue) :-
  % Fields the rule applies to
  member(FieldName, ['main', 'types']),
  % Get current value
  workspace_field(WorkspaceCwd, FieldName, CurrentValue),
  % Must not start with ./ already
  \+ atom_concat('./', _, CurrentValue),
  % Store './' + CurrentValue in ExpectedValue
  atom_concat('./', CurrentValue, ExpectedValue).

% Lint staged _not_ a key in package.json. Use .lintstagedrc.js instead!
gen_enforced_field(WorkspaceCwd, 'lint-staged', null) :-
  workspace_field(WorkspaceCwd, 'lint-staged', _).

% Enforces the repository field for all public workspaces while removing it from private workspaces
gen_enforced_field(WorkspaceCwd, 'repository.type', 'git') :-
  \+ workspace_field(WorkspaceCwd, 'private', true).
gen_enforced_field(WorkspaceCwd, 'repository.url', 'https://github.com/segmentio/analytics-next') :-
  \+ workspace_field(WorkspaceCwd, 'private', true).
gen_enforced_field(WorkspaceCwd, 'repository.directory', WorkspaceCwd) :-
  \+ workspace_field(WorkspaceCwd, 'private', true).
gen_enforced_field(WorkspaceCwd, 'repository', null) :-
  workspace_field(WorkspaceCwd, 'private', true).

% Do not allow a `dependencies` field in root workspace -- we only want to share devDependencies
gen_enforced_field(WorkspaceCwd, 'dependencies', null) :-
  member(WorkspaceCwd, ['.']),
  workspace_field(WorkspaceCwd, 'dependencies', _).
