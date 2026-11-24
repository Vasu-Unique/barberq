import math
from typing import Generic, List, Sequence, TypeVar
from app.schemas.common import PaginatedResponse

T = TypeVar("T")


def paginate(
    items: Sequence[T],
    total: int,
    page: int,
    limit: int,
) -> PaginatedResponse[T]:
    total_pages = math.ceil(total / limit) if limit > 0 else 1
    return PaginatedResponse(
        items=list(items),
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )
