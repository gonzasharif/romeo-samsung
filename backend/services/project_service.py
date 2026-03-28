from models.domain import AgentProfile, TargetModel, ProjectContext, StatsResponse
from utils.common import new_id

def generate_defaults(context: ProjectContext, project_id: str) -> tuple[list[TargetModel], list[AgentProfile]]:
    product_name = context.product_name

    m1 = TargetModel(
        id=new_id("model"),
        project_id=project_id,
        name="Comprador pragmático",
        age_range="30-45",
        attitude=1,
    )
    a1 = AgentProfile(
        id=new_id("agent"),
        model_id=m1.id,
        name="Juan",
        gender="Masculino",
        segment="Profesionales ocupados",
        motivations=[f"Quiere resolver rápido la necesidad que cubre {product_name}"],
        objections=["Necesita ver retorno claro de la compra"]
    )

    m2 = TargetModel(
        id=new_id("model"),
        project_id=project_id,
        name="Early adopter",
        age_range="24-35",
        attitude=0,
    )
    a2 = AgentProfile(
        id=new_id("agent"),
        model_id=m2.id,
        name="Sofía",
        gender="Femenino",
        segment="Usuarios curiosos por soluciones nuevas",
        motivations=["Prueba productos nuevos si la propuesta se entiende fácil"],
        objections=["Abandona si la propuesta se siente genérica"]
    )

    m3 = TargetModel(
        id=new_id("model"),
        project_id=project_id,
        name="Escéptico racional",
        age_range="35-55",
        attitude=2,
    )
    a3 = AgentProfile(
        id=new_id("agent"),
        model_id=m3.id,
        name="Carlos",
        gender="Masculino",
        segment="Compradores comparativos",
        motivations=["Compra si la propuesta supera alternativas conocidas"],
        objections=["Duda del precio y de la diferenciación"]
    )

    return [m1, m2, m3], [a1, a2, a3]

def default_stats() -> StatsResponse:
    return StatsResponse(
        demand_score=72,
        willingness_to_pay_score=63,
        clarity_score=58,
        objection_distribution={
            "precio": 4,
            "claridad": 3,
            "confianza": 2,
        },
        sentiment_distribution={
            "positivo": 6,
            "neutral": 3,
            "negativo": 2,
        },
    )
