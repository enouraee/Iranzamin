import factory

from apps.contracts.models import CONTRACT_TYPE_SALE, Contract
from apps.people.tests.factories import PersonFactory
from apps.properties.tests.factories import PropertyFactory


class ContractFactory(factory.django.DjangoModelFactory):
    property = factory.SubFactory(PropertyFactory)
    party_a = factory.SubFactory(PersonFactory)
    party_b = factory.SubFactory(PersonFactory)
    contract_type = CONTRACT_TYPE_SALE
    start_date = "2024-01-01"
    end_date = None
    sale_price = 5_000_000_000
    deposit_amount = None
    monthly_rent = None
    rahn_amount = None
    contract_image = ""
    notes = ""

    class Meta:
        model = Contract
