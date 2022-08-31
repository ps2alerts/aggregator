#!/usr/bin/python
import os

class FilterModule(object):
    def filters(self):
        return {
            'masked_instance_id': self.masked_instance_id
        }

    def masked_instance_id(self, instanceId):
        return ((int(instanceId) << 16) | 10)
