import { useState } from 'react';
import { Button, Input, InputGroup, InputRightElement, Stack } from '@chakra-ui/react'
import React from 'react';

type EventInfo = {
  title: string;
  description: string;
  start_date: string;
  presenters: string[];
};

type Links = {
  viewer: string;
  moderator: string;
}

function Form() {
  const [links, setLinks] = useState<Links>();
  const [currParticipant, setCurrParticipant] = useState<string>("");
  const [eventInfo, setEventInfo] = useState<EventInfo>({title: "", description: "", start_date: "", presenters: []});

  const handleInputTitle = (event: any) => setEventInfo({...eventInfo, title: event.target.value});
  const handleInputDescription = (event: any) => setEventInfo({...eventInfo, description: event.target.value});
  const handleInputDate = (event: any) => setEventInfo({...eventInfo, start_date: event.target.value});
  const handleInputParticipant = (event: any) => setCurrParticipant(event.target.value);
  const handleAddButton = () => {
    setEventInfo({...eventInfo, presenters: [...eventInfo.presenters, currParticipant]});
    setCurrParticipant("")
  }

  // ${window._env_.DASHBOARD_SERVER_URL}
  const handleSendButton = () => {
    fetch("http://localhost:4000/new", {
      method: "post",
      headers: { 
        "Content-Type": "application/json",
        'Accept': 'application/json'
        },
      body: JSON.stringify(eventInfo)
    }).then((response) => {
            return response.json();
    }).then((data) => {
      setLinks(JSON.parse(data));
    });
  };

  return (
    <div>
      <Stack spacing={4} mx={4} width='22rem'>
        <Input type='top' placeholder='Title' onChange={handleInputTitle}/>
        <Input type='desc' placeholder='Description' onChange={handleInputDescription}/>
        <Input
        placeholder="Select Date and Time"
        size="md"
        backgroundColor="#ffffff"
        type="datetime-local"
        onChange={handleInputDate}
        />
        <InputGroup size='md'>
          <Input
            pr='4.5rem'
            type='text'
            placeholder='Enter participant'
            value={currParticipant}
            onChange={handleInputParticipant}
          />
          <InputRightElement width='4.5rem'>
            <Button h='1.75rem' size='sm' onClick={handleAddButton}>
              Add
            </Button>
          </InputRightElement>
        </InputGroup>
      </Stack>
      <Button h='1.75rem' size='sm' onClick={handleSendButton}>
        Send
      </Button>
    </div>
  );
}

export default Form;