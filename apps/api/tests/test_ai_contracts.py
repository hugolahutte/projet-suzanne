import pytest
from suzanne.ai_contracts import jev_request, parse_intent, chat_request


def test_jev_is_a_decision_not_chat():
    payload = jev_request('Explique les fractions')
    assert payload['questions']['intent']['type'] == 'choice'
    assert 'messages' not in payload
    assert payload['state'] == 'Explique les fractions'


@pytest.mark.parametrize('response', [{}, {'answers':None}, {'answers':{'intent':{'choice':'run_shell','confidence':1}}}, {'answers':{'intent':{'choice':'school','confidence':0.79}}}, {'answers':{'intent':{'choice':'school','confidence':float('nan')}}}, {'answers':{'intent':{'choice':'school','confidence':True}}}])
def test_jev_uncertainty_is_not_permission(response):
    assert parse_intent(response) == 'clarify'


def test_jev_known_confident_intent():
    assert parse_intent({'answers':{'intent':{'choice':'school','confidence':0.9}}}) == 'school'


def test_chat_explicit_model_privacy_price_and_size():
    args = dict(model='test/model', allowed_models=('test/model',), max_prompt_price=1, max_completion_price=2)
    payload = chat_request('Une explication fictive', **args)
    assert payload['provider']['allow_fallbacks'] is False
    assert payload['provider']['zdr'] is True
    assert payload['provider']['max_price'] == {'prompt':1,'completion':2}
    assert payload['max_tokens'] == 600
    with pytest.raises(ValueError):
        chat_request('x', **{**args, 'model':'unapproved/model'})
    with pytest.raises(ValueError):
        chat_request('x' * 4001, **args)
    with pytest.raises(ValueError):
        chat_request('x', **{**args, 'max_prompt_price':float('inf')})
