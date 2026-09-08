from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.db import DATABASE_URL, Base
from app import models  # noqa: F401  (registers the tables on Base.metadata)

config = context.config
config.set_main_option("sqlalchemy.url", DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def include_object(object, name, type_, reflected, compare_to):
    """Skip PostGIS internals when autogenerating."""
    if type_ == "table" and name in {"spatial_ref_sys", "geography_columns", "geometry_columns"}:
        return False
    if type_ == "index" and name is not None and name.startswith("idx_"):
        # GIST indexes created automatically by GeoAlchemy2/PostGIS.
        return False
    return True

def run_migrations_offline() -> None:
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        include_object=include_object,
        compare_type=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        # GéoEmploi objects live in `public`: ignore any extra schema the
        # PostgreSQL image may have added to the search_path. The search_path is
        # set on the connection rather than with a SET statement, which would
        # open a transaction before Alembic and leave its work uncommitted.
        connect_args={"options": "-csearch_path=public"},
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_object=include_object,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
