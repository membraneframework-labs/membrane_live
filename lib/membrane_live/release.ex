defmodule MembraneLive.Release do
  @app :membrane_live

  def create_and_migrate do
    load_app()

    for repo <- repos() do
      with :ok <- ensure_repo_created(repo),
           {:ok, _, _} <- Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :up, all: true))
      do
        :ok
      else
        raise "DB problem"
      end
    end
  end

  def migrate do
    load_app()

    for repo <- repos() do
      {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :up, all: true))
    end
  end

  def rollback(repo, version) do
    load_app()
    {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :down, to: version))
  end

  defp repos do
    Application.fetch_env!(@app, :ecto_repos)
  end

  defp load_app do
    Application.load(@app)
  end

  defp ensure_repo_created(repo) do
    case repo.__adapter__.storage_up(repo.config) do
      :ok -> :ok
      {:error, :already_up} -> :ok
      {:error, term} -> {:error, term}
    end
  end
end
