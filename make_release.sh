mix deps.get --only prod
MIX_ENV=prod mix compile

MIX_ENV=prod mix assets.deploy

yes | mix phx.gen.release

yes | MIX_ENV=prod mix release

echo """
////////////////////////////////////////////////////

Release ready. On server type: 

$> tmux 
$> _build/prod/rel/membrane_live/bin/membrane_live start

crtl + b then d - to go out of tmux
"""
