import os
import unittest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

os.environ["OPENROUTER_API_KEY"] = "mock_openrouter_key"
os.environ["REDIS_HOST"] = "127.0.0.1"
os.environ["REDIS_PORT"] = "6379"

from app.app import create_app
from app.session import session_store
from app.rate_limiter import rate_limit_db
from app.tools.weather import get_current_weather
from app.tools.audio import control_audio_player
from app.tools.portfolio import get_portfolio_info

app = create_app()
client = TestClient(app)


class TestChatbotGateway(unittest.TestCase):

    def setUp(self):
        rate_limit_db.clear()
        session_store.in_memory_db.clear()
        if session_store.redis_client:
            try:
                session_store.redis_client.flushall()
            except Exception:
                pass

    def test_health_check(self):
        response = client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertIn("status", response.json())
        self.assertIn("redis_connected", response.json())

    def test_get_current_weather_tool(self):
        res = get_current_weather("Cimahi")
        self.assertIn("26°C", res)

        res_bandung = get_current_weather("Bandung")
        self.assertIn("22°C", res_bandung)

        res_unknown = get_current_weather("Semarang")
        self.assertIn("25°C", res_unknown)

    def test_get_portfolio_info_tool(self):
        res = get_portfolio_info("skills")
        self.assertIn("Python", res)
        self.assertIn("FastAPI", res)

        res_exp = get_portfolio_info("experience")
        self.assertIn("Backend Engineer", res_exp)

        res_proj = get_portfolio_info("projects")
        self.assertIn("Syncra", res_proj)

    @patch("app.routes.OpenAI")
    def test_chat_message_text_response(self, mock_client_class):
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client

        mock_response = MagicMock()
        mock_message = MagicMock()
        mock_message.content = "Halo, saya adalah asisten RaflyLabs."
        mock_message.tool_calls = None
        mock_response.choices = [MagicMock(message=mock_message)]
        mock_client.chat.completions.create.return_value = mock_response

        payload = {
            "session_id": "test_session_1",
            "source_platform": "web_porto",
            "message": "Halo",
        }
        response = client.post("/api/v1/chat/message", json=payload)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["session_id"], "test_session_1")
        self.assertEqual(data["response_type"], "text")
        self.assertEqual(data["content"], "Halo, saya adalah asisten RaflyLabs.")
        self.assertIsNone(data["action_triggered"])

        history = session_store.get_history("test_session_1")
        self.assertEqual(len(history), 2)
        self.assertEqual(history[0]["role"], "user")
        self.assertEqual(history[0]["message"], "Halo")
        self.assertEqual(history[1]["role"], "model")
        self.assertEqual(history[1]["message"], "Halo, saya adalah asisten RaflyLabs.")

    @patch("app.routes.OpenAI")
    def test_chat_message_action_response(self, mock_client_class):
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client

        mock_tool_call = MagicMock()
        mock_tool_call.id = "call_123"
        mock_tool_call.function.name = "control_audio_player"
        mock_tool_call.function.arguments = '{"action": "PLAY_TRACK", "genre": "lo-fi"}'

        mock_message_with_tools = MagicMock()
        mock_message_with_tools.content = None
        mock_message_with_tools.tool_calls = [mock_tool_call]

        mock_message_final = MagicMock()
        mock_message_final.content = "Memutar musik lo-fi."
        mock_message_final.tool_calls = None

        mock_response1 = MagicMock()
        mock_response1.choices = [MagicMock(message=mock_message_with_tools)]

        mock_response2 = MagicMock()
        mock_response2.choices = [MagicMock(message=mock_message_final)]

        mock_client.chat.completions.create.side_effect = [mock_response1, mock_response2]

        payload = {
            "session_id": "test_session_2",
            "source_platform": "audio_stream",
            "message": "Putar musik lofi dong",
        }
        response = client.post("/api/v1/chat/message", json=payload)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["session_id"], "test_session_2")
        self.assertEqual(data["response_type"], "action")
        self.assertEqual(data["content"], "Memutar musik lo-fi.")
        self.assertIsNotNone(data["action_triggered"])
        self.assertEqual(data["action_triggered"]["target_service"], "audio_stream")
        self.assertEqual(data["action_triggered"]["command"], "PLAY_TRACK")
        self.assertEqual(data["action_triggered"]["parameters"]["genre"], "lo-fi")

    @patch("app.routes.OpenAI")
    def test_rate_limiting(self, mock_client_class):
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_response = MagicMock()
        mock_message = MagicMock()
        mock_message.content = "Respon"
        mock_message.tool_calls = None
        mock_response.choices = [MagicMock(message=mock_message)]
        mock_client.chat.completions.create.return_value = mock_response

        payload = {
            "session_id": "test_session_limit",
            "source_platform": "web_porto",
            "message": "Halo",
        }

        for _ in range(10):
            response = client.post("/api/v1/chat/message", json=payload)
            self.assertEqual(response.status_code, 200)

        response = client.post("/api/v1/chat/message", json=payload)
        self.assertEqual(response.status_code, 429)
        self.assertIn("Rate limit terlampaui", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
