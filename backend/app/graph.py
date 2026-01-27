import os
from typing import Annotated, List, TypedDict

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, BaseMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph.message import add_messages
from dotenv import load_dotenv

load_dotenv()

class ChefState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    recipe_context: str
    
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7, streaming=True)

def chef_node(state: ChefState):
    recipe = state.get("recipe_context", "no recipe provided")
    messages = state["messages"]

    system_prompt = f"""
    You are SnapCook, a friendly, encouraging, Michelin-star sous-chef.
    
    YOUR CURRENT TASK:
    The user is cooking the following recipe. Guide them through it step-by-step.
    
    RECIPE CONTEXT:
    {recipe}
    
    GUIDELINES:
    1. If this is the start of the conversation, welcome them and then summarize about the dish.
    2. Keep answers concise (2-3 sentences max) unless asked for details. If detailed answer is asked then keep it detailed dont restrict yourself to 2-3 lines.
    3. If the user asks something unrelated to cooking or the dish, politely steer them back to the recipe. Remember to answer anything related to dish like its nutirional values or how to eat it or anything about the dish just answer it.
    4. Be encouraging! Use emojis like 🍳, 👨‍🍳, 🔥 etc.
    5. If the user asks a detailed answer then don't try to be concise but precise and a detailed one.
    6. Always give the recipe steps in points. Do not try to fit them inline.
    7. Always try to provide a substitute for any missing ingredient.
    8. Try to be straightforward as much as you can.
    9. Add new lines when necessary like after each step.
    """
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="messages")
    ])

    chain = prompt | llm
    response = chain.invoke({"messages": messages})

    return {"messages": [response]}

builder = StateGraph(ChefState)

builder.add_node("chef", chef_node)
builder.set_entry_point("chef")
builder.add_edge("chef", END)

memory = MemorySaver()

graph = builder.compile(checkpointer=memory)

async def run_agent(thread_id: str, user_input: str, recipe_context: str = None):
    config = {"configurable": {"thread_id": thread_id}}

    inputs = {"messages": [HumanMessage(content=user_input)]}

    if recipe_context:
        inputs["recipe_context"] = recipe_context
        
    async for event in graph.astream(inputs, config):
        # Get the node output from the event
        for node_name, node_output in event.items():
            if node_name == "chef" and "messages" in node_output:
                message = node_output["messages"][-1]  # Get the latest message
                if hasattr(message, 'content') and message.content:
                    yield message.content