from models.domain import AgentProfile, ProjectContext, StatsResponse
from utils.common import new_id

def default_agents(context: ProjectContext) -> list[AgentProfile]:
    product_name = context.product_name
    return [
        AgentProfile(
            id=new_id("agent"),
            name="Comprador pragmático",
            age_range="30-45",
            segment="Profesionales ocupados",
            motivations=[f"Quiere resolver rápido la necesidad que cubre {product_name}"],
            objections=["Necesita ver retorno claro de la compra"],
        ),
        AgentProfile(
            id=new_id("agent"),
            name="Early adopter",
            age_range="24-35",
            segment="Usuarios curiosos por soluciones nuevas",
            motivations=["Prueba productos nuevos si la propuesta se entiende fácil"],
            objections=["Abandona si la propuesta se siente genérica"],
        ),
        AgentProfile(
            id=new_id("agent"),
            name="Escéptico racional",
            age_range="35-55",
            segment="Compradores comparativos",
            motivations=["Compra si la propuesta supera alternativas conocidas"],
            objections=["Duda del precio y de la diferenciación"],
        ),
    ]

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
